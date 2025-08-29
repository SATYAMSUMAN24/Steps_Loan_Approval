// Global state management
let currentStep = 0; // Start with loan selection
let formData = {
    loanAmount: 1000000, // Default 10 lakhs
    interestRate: 8.5,
    tenure: 84
};
let uploadedDocuments = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    updateStepDisplay();
    setupEventListeners();
    setupAutoCalculations();
    setupTenureSlider();
    setApplicationDate();
});

// Setup event listeners
function setupEventListeners() {
    // Selection button handlers
    const selectionButtons = document.querySelectorAll('.selection-btn');
    selectionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const group = this.closest('.selection-group');
            const buttons = group.querySelectorAll('.selection-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Handle loan type selection to show/hide sub-type
            if (this.dataset.value === 'vehicle') {
                const subTypeSection = document.getElementById('loan-sub-type');
                if (subTypeSection) subTypeSection.style.display = 'block';
            } else if (this.closest('.selection-group').querySelector('[data-value="vehicle"]')) {
                const subTypeSection = document.getElementById('loan-sub-type');
                if (subTypeSection) subTypeSection.style.display = 'none';
            }
        });
    });
    
    // Form input handlers for data persistence
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('change', saveFormData);
        input.addEventListener('input', saveFormData);
    });
    
    // Verify button handler
    const verifyBtn = document.querySelector('.verify-btn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', function() {
            const mobileInput = document.getElementById('mobile');
            if (mobileInput.value && validateMobile(mobileInput.value)) {
                showLoading();
                setTimeout(() => {
                    hideLoading();
                    alert('Verification sent to ' + mobileInput.value);
                    this.textContent = 'Verified';
                    this.style.backgroundColor = '#4CAF50';
                    this.disabled = true;
                }, 2000);
            } else {
                showError('Please enter a valid 10-digit mobile number');
            }
        });
    }
    
    // Existing customer dropdown handler
    const existingCustomerSelect = document.getElementById('existingCustomer');
    if (existingCustomerSelect) {
        existingCustomerSelect.addEventListener('change', function() {
            const cifField = document.getElementById('cifNumber');
            if (this.value === 'yes') {
                cifField.required = true;
                cifField.parentElement.style.display = 'block';
            } else {
                cifField.required = false;
                cifField.value = '';
            }
        });
    }
}

// Navigation functions
function nextStep() {
    if (validateCurrentStep()) {
        saveFormData();
        currentStep++;
        
        // Handle special navigation
        if (currentStep === 5) {
            // After step 4 (offer), go to document upload
            updateStepDisplay();
        } else if (currentStep === 6) {
            // After document upload, go to final approval
            updateStepDisplay();
        } else {
            updateStepDisplay();
            updateProgressStepper();
        }
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        
        if (currentStep === 5) {
            // Going back to document upload
            updateStepDisplay();
        } else if (currentStep >= 1 && currentStep <= 4) {
            // Normal steps with progress stepper
            updateStepDisplay();
            updateProgressStepper();
        } else {
            // Loan selection page
            updateStepDisplay();
        }
    }
}

function startApplication() {
    saveSelectionData();
    currentStep = 1;
    updateStepDisplay();
    updateProgressStepper();
}

// Display management
function updateStepDisplay() {
    // Hide all step contents
    const stepContents = document.querySelectorAll('.step-content');
    stepContents.forEach(content => {
        content.style.display = 'none';
    });
    
    // Hide/show progress stepper based on current step
    const progressStepper = document.querySelector('.progress-stepper');
    if (progressStepper) {
        if (currentStep === 0 || currentStep >= 5) {
            progressStepper.style.display = 'none';
        } else {
            progressStepper.style.display = 'flex';
        }
    }
    
    // Show current step
    if (currentStep === 0) {
        // Loan selection page
        const loanSelection = document.getElementById('loan-selection');
        if (loanSelection) loanSelection.style.display = 'block';
    } else if (currentStep >= 1 && currentStep <= 4) {
        // Normal application steps
        const currentStepElement = document.getElementById(`step-${currentStep}`);
        if (currentStepElement) currentStepElement.style.display = 'block';
    } else if (currentStep === 5) {
        // Document upload page
        const documentUpload = document.getElementById('document-upload');
        if (documentUpload) documentUpload.style.display = 'block';
    } else if (currentStep === 6) {
        // Final approval page
        const finalApproval = document.getElementById('final-approval');
        if (finalApproval) finalApproval.style.display = 'block';
    } else if (currentStep === 7) {
        // Thank you page
        const thankYou = document.getElementById('thank-you');
        if (thankYou) thankYou.style.display = 'block';
    }
    
    // Update EMI calculation when showing offer
    if (currentStep === 4) {
        calculateEMI();
    }
}

function updateProgressStepper() {
    const steps = document.querySelectorAll('.step[data-step]');
    steps.forEach(step => {
        const stepNumber = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');
        
        if (stepNumber === currentStep) {
            step.classList.add('active');
        } else if (stepNumber < currentStep) {
            step.classList.add('completed');
        }
    });
}

// Validation functions
function validateCurrentStep() {
    switch (currentStep) {
        case 0:
            return validateLoanSelection();
        case 1:
            return validateBasicDetails();
        case 2:
            return validatePersonalDetails();
        case 3:
            return validateIncomeDetails();
        case 4:
            return true; // Offer page
        case 5:
            return validateDocumentUpload();
        default:
            return true;
    }
}

function validateLoanSelection() {
    const loanTypeSelected = document.querySelector('.selection-btn.active[data-value]');
    if (!loanTypeSelected) {
        showError('Please select a loan type to continue');
        return false;
    }
    return true;
}

function validateDocumentUpload() {
    const requiredDocs = ['bankStatement', 'dealerInvoice', 'gstDoc', 'itrDoc'];
    const uploadedCount = Object.keys(uploadedDocuments).length;
    
    if (uploadedCount < 4) {
        showError(`Please upload all required documents. ${4 - uploadedCount} documents remaining.`);
        return false;
    }
    return true;
}

function validateBasicDetails() {
    const fullName = document.getElementById('fullName').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const loanAmount = document.getElementById('loanAmount').value.trim();
    const panNumber = document.getElementById('panNumber').value.trim();
    const agreeOVD = document.getElementById('agreeOVD').checked;
    
    // Clear previous errors
    clearFieldErrors();
    
    let isValid = true;
    
    if (!fullName) {
        showFieldError('fullName', 'Please enter your full name');
        isValid = false;
    }
    
    if (!mobile || !validateMobile(mobile)) {
        showFieldError('mobile', 'Please enter a valid 10-digit mobile number');
        isValid = false;
    }
    
    if (!loanAmount || parseFloat(loanAmount) <= 0) {
        showFieldError('loanAmount', 'Please enter a valid loan amount');
        isValid = false;
    } else {
        formData.loanAmount = parseFloat(loanAmount);
    }
    
    if (!panNumber || !validatePAN(panNumber)) {
        showFieldError('panNumber', 'Please enter a valid PAN number (e.g., ABCDE1234F)');
        isValid = false;
    }
    
    if (!agreeOVD) {
        showError('Please agree to validate OVD details');
        isValid = false;
    }
    
    return isValid;
}

function validatePersonalDetails() {
    const address = document.getElementById('address').value.trim();
    const dob = document.getElementById('dob').value;
    const fatherName = document.getElementById('fatherName').value.trim();
    const aadharNumber = document.getElementById('aadharNumber').value.trim();
    const email = document.getElementById('email').value.trim();
    const gender = document.getElementById('gender').value;
    const existingCustomer = document.getElementById('existingCustomer').value;
    const cifNumber = document.getElementById('cifNumber').value.trim();
    const residenceType = document.getElementById('residenceType').value;
    const yearsAtResidence = document.getElementById('yearsAtResidence').value;
    
    clearFieldErrors();
    
    let isValid = true;
    
    if (!address) {
        showFieldError('address', 'Please enter your address');
        isValid = false;
    }
    
    if (!dob) {
        showFieldError('dob', 'Please select your date of birth');
        isValid = false;
    }
    
    if (!fatherName) {
        showFieldError('fatherName', 'Please enter your father\'s name');
        isValid = false;
    }
    
    if (!aadharNumber || !validateAadhar(aadharNumber)) {
        showFieldError('aadharNumber', 'Please enter a valid 12-digit Aadhar number');
        isValid = false;
    }
    
    if (!email || !validateEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!gender) {
        showFieldError('gender', 'Please select your gender');
        isValid = false;
    }
    
    if (!existingCustomer) {
        showFieldError('existingCustomer', 'Please specify if you are an existing customer');
        isValid = false;
    }
    
    if (existingCustomer === 'yes' && !cifNumber) {
        showFieldError('cifNumber', 'Please enter your CIF number');
        isValid = false;
    }
    
    if (!residenceType) {
        showFieldError('residenceType', 'Please select your residence type');
        isValid = false;
    }
    
    if (!yearsAtResidence || parseFloat(yearsAtResidence) < 0) {
        showFieldError('yearsAtResidence', 'Please enter valid years at current residence');
        isValid = false;
    }
    
    return isValid;
}

function validateIncomeDetails() {
    const employerName = document.getElementById('employerName').value.trim();
    const grossMonthlyIncome = document.getElementById('grossMonthlyIncome').value;
    const totalMonthlyObligation = document.getElementById('totalMonthlyObligation').value;
    const yearsAtEmployer = document.getElementById('yearsAtEmployer').value;
    const officialEmailID = document.getElementById('officialEmailID').value.trim();
    
    clearFieldErrors();
    
    let isValid = true;
    
    if (!employerName) {
        showFieldError('employerName', 'Please enter your employer name');
        isValid = false;
    }
    
    if (!grossMonthlyIncome || parseFloat(grossMonthlyIncome) <= 0) {
        showFieldError('grossMonthlyIncome', 'Please enter a valid gross monthly income');
        isValid = false;
    }
    
    if (!totalMonthlyObligation || parseFloat(totalMonthlyObligation) < 0) {
        showFieldError('totalMonthlyObligation', 'Please enter valid total monthly obligation');
        isValid = false;
    }
    
    if (!yearsAtEmployer || parseFloat(yearsAtEmployer) < 0) {
        showFieldError('yearsAtEmployer', 'Please enter valid years at current employer');
        isValid = false;
    }
    
    if (!officialEmailID || !validateEmail(officialEmailID)) {
        showFieldError('officialEmailID', 'Please enter a valid official email address');
        isValid = false;
    }
    
    return isValid;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.parentElement.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) existingError.remove();
        
        // Add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        field.parentElement.appendChild(errorElement);
    }
}

function clearFieldErrors() {
    const errorFields = document.querySelectorAll('.form-group.error');
    errorFields.forEach(field => {
        field.classList.remove('error');
        const errorMessage = field.querySelector('.field-error');
        if (errorMessage) errorMessage.remove();
    });
    
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
}


// Data persistence functions
function saveFormData() {
    const formInputs = document.querySelectorAll('input');
    formInputs.forEach(input => {
        if (input.type !== 'checkbox') {
            formData[input.id] = input.value;
        } else {
            formData[input.id] = input.checked;
        }
    });
    
    localStorage.setItem('loanApplicationData', JSON.stringify(formData));
}

function saveSelectionData() {
    const selections = {};
    const activeButtons = document.querySelectorAll('.selection-btn.active');
    activeButtons.forEach(button => {
        const group = button.closest('.selection-group');
        const label = group.querySelector('label').textContent.toLowerCase().replace(/\s+/g, '_');
        selections[label] = button.dataset.value;
    });
    
    formData.selections = selections;
    localStorage.setItem('loanApplicationData', JSON.stringify(formData));
}

function loadSavedData() {
    const savedData = localStorage.getItem('loanApplicationData');
    if (savedData) {
        formData = JSON.parse(savedData);
        
        // Restore form values
        Object.keys(formData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type !== 'checkbox') {
                    element.value = formData[key];
                } else {
                    element.checked = formData[key];
                }
            }
        });
        
        // Restore selections
        if (formData.selections) {
            Object.keys(formData.selections).forEach(groupKey => {
                const value = formData.selections[groupKey];
                const button = document.querySelector(`[data-value="${value}"]`);
                if (button) {
                    const group = button.closest('.selection-group');
                    const buttons = group.querySelectorAll('.selection-btn');
                    buttons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                }
            });
        }
    }
}

// Utility functions
function resetApplication() {
    localStorage.removeItem('loanApplicationData');
    formData = {
        loanAmount: 1000000,
        interestRate: 8.5,
        tenure: 84
    };
    uploadedDocuments = {};
    currentStep = 0; // Start with loan selection
    updateStepDisplay();
    
    // Reset forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());
    
    // Reset selections
    const activeButtons = document.querySelectorAll('.selection-btn.active');
    activeButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Reset upload boxes
    const uploadBoxes = document.querySelectorAll('.upload-box');
    uploadBoxes.forEach(box => {
        box.classList.remove('uploaded');
        const statusElement = box.querySelector('.upload-status');
        if (statusElement) statusElement.textContent = '';
        const button = box.querySelector('.upload-btn');
        if (button) {
            button.textContent = 'Upload';
            button.style.backgroundColor = '#ff9800';
        }
    });
}

function showLoanSelection() {
    currentStep = 0;
    updateStepDisplay();
}

function showDocumentUpload() {
    if (currentStep < 5) {
        currentStep = 5;
        updateStepDisplay();
    }
}

function showFinalApproval() {
    currentStep = 6;
    updateStepDisplay();
}

// Enhanced upload functionality
function handleFileUpload(uploadType, documentId, buttonElement) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showError('File size should not exceed 5MB');
                return;
            }
            
            showLoading();
            
            // Simulate upload process
            setTimeout(() => {
                hideLoading();
                
                // Mark as uploaded
                uploadedDocuments[documentId] = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    uploadDate: new Date()
                };
                
                // Update UI
                const uploadBox = document.getElementById(documentId);
                uploadBox.classList.add('uploaded');
                
                const statusElement = uploadBox.querySelector('.upload-status');
                statusElement.textContent = `✓ ${file.name}`;
                
                buttonElement.textContent = 'Re-upload';
                buttonElement.style.backgroundColor = '#28a745';
                
                // Check if all documents are uploaded
                checkAllDocumentsUploaded();
                
                showSuccess(`${uploadType} uploaded successfully!`);
            }, 1500);
        }
    };
    input.click();
}

function checkAllDocumentsUploaded() {
    const requiredDocs = ['bankStatement', 'dealerInvoice', 'gstDoc', 'itrDoc'];
    const allUploaded = requiredDocs.every(docId => uploadedDocuments[docId]);
    
    const proceedButton = document.getElementById('proceedToApproval');
    if (proceedButton) {
        if (allUploaded) {
            proceedButton.style.backgroundColor = '#28a745';
            proceedButton.textContent = 'All Documents Uploaded - Proceed';
        } else {
            proceedButton.style.backgroundColor = '#f44336';
            proceedButton.textContent = `Upload ${4 - Object.keys(uploadedDocuments).length} more documents`;
        }
    }
}

// Enhanced upload functionality
function setupUploadHandlers() {
    const uploadButtons = document.querySelectorAll('.upload-btn');
    uploadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const uploadBox = this.closest('.upload-box');
            const uploadType = uploadBox.querySelector('h3').textContent;
            const documentId = uploadBox.id;
            handleFileUpload(uploadType, documentId, this);
        });
    });
}

// Call setup on DOM load
document.addEventListener('DOMContentLoaded', setupUploadHandlers);

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'INPUT' && activeElement.type !== 'checkbox') {
            event.preventDefault();
            const nextBtn = document.querySelector('.next-btn');
            if (nextBtn && nextBtn.style.display !== 'none') {
                nextBtn.click();
            }
        }
    }
});

// Demo functions for testing
function simulateSteps() {
    // Fill demo data
    document.getElementById('fullName').value = 'John Doe';
    document.getElementById('mobile').value = '9876543210';
    document.getElementById('loanAmount').value = '500000';
    document.getElementById('panNumber').value = 'ABCDE1234F';
    document.getElementById('agreeOVD').checked = true;
    
    saveFormData();
    alert('Demo data filled. You can now navigate through the steps.');
}

// Auto-calculation setup
function setupAutoCalculations() {
    const grossIncomeInput = document.getElementById('grossMonthlyIncome');
    const bonusInput = document.getElementById('bonusOvertimeArrear');
    const totalIncomeInput = document.getElementById('totalIncome');
    const obligationInput = document.getElementById('totalMonthlyObligation');
    const netSalaryInput = document.getElementById('netMonthlySalary');
    
    function calculateTotals() {
        const grossIncome = parseFloat(grossIncomeInput?.value || 0);
        const bonus = parseFloat(bonusInput?.value || 0);
        const obligation = parseFloat(obligationInput?.value || 0);
        
        const totalIncome = grossIncome - bonus;
        const netSalary = totalIncome - obligation;
        
        if (totalIncomeInput) totalIncomeInput.value = totalIncome.toFixed(2);
        if (netSalaryInput) netSalaryInput.value = netSalary.toFixed(2);
    }
    
    [grossIncomeInput, bonusInput, obligationInput].forEach(input => {
        if (input) {
            input.addEventListener('input', calculateTotals);
            input.addEventListener('change', calculateTotals);
        }
    });
}

// Tenure slider setup
function setupTenureSlider() {
    const slider = document.getElementById('tenureSlider');
    const display = document.getElementById('tenureDisplay');
    const emiDisplay = document.getElementById('dynamicEMI');
    
    if (slider && display) {
        slider.addEventListener('input', function() {
            const tenure = parseInt(this.value);
            display.textContent = tenure;
            formData.tenure = tenure;
            calculateEMI();
        });
    }
}

// EMI Calculation
function calculateEMI() {
    const principal = formData.loanAmount || 1000000;
    const rate = (formData.interestRate || 8.5) / 100 / 12;
    const tenure = formData.tenure || 84;
    
    const emi = (principal * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);
    
    const emiDisplay = document.getElementById('dynamicEMI');
    if (emiDisplay) {
        emiDisplay.textContent = `Rs. ${Math.round(emi).toLocaleString('en-IN')} p.m.`;
    }
    
    // Update other displays
    const loanAmountDisplay = document.getElementById('displayLoanAmount');
    const interestRateDisplay = document.getElementById('displayInterestRate');
    
    if (loanAmountDisplay) {
        loanAmountDisplay.textContent = `${(principal / 100000).toFixed(1)} Lakhs`;
    }
    
    if (interestRateDisplay) {
        interestRateDisplay.textContent = formData.interestRate || '8.50';
    }
}

// Enhanced validation functions
function validateMobile(mobile) {
    return /^[6-9]\d{9}$/.test(mobile);
}

function validatePAN(pan) {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
}

function validateAadhar(aadhar) {
    return /^\d{12}$/.test(aadhar.replace(/\s/g, ''));
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// UI Helper functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.step-content:not([style*="display: none"])');
    if (container) {
        container.insertBefore(errorDiv, container.firstChild);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'error-message';
    successDiv.style.backgroundColor = '#d4edda';
    successDiv.style.color = '#155724';
    successDiv.style.borderColor = '#c3e6cb';
    successDiv.textContent = message;
    
    const container = document.querySelector('.step-content:not([style*="display: none"])');
    if (container) {
        container.insertBefore(successDiv, container.firstChild);
        setTimeout(() => successDiv.remove(), 3000);
    }
}

// Application date setup
function setApplicationDate() {
    const dateElement = document.getElementById('applicationDate');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('en-IN');
    }
}

// Thank you page functions
function showThankYou() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        currentStep = 7;
        updateStepDisplay();
    }, 2000);
}

function restartApplication() {
    if (confirm('Are you sure you want to start a new application? All current data will be lost.')) {
        resetApplication();
    }
}

function downloadSummary() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        alert('Application summary has been downloaded to your device.');
    }, 1500);
}

// Export functions for global access
window.nextStep = nextStep;
window.prevStep = prevStep;
window.startApplication = startApplication;
window.showLoanSelection = showLoanSelection;
window.showDocumentUpload = showDocumentUpload;
window.showFinalApproval = showFinalApproval;
window.resetApplication = resetApplication;
window.simulateSteps = simulateSteps;
window.showThankYou = showThankYou;
window.restartApplication = restartApplication;
window.downloadSummary = downloadSummary;