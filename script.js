const form = document.getElementById('regForm');
// --- Select Input Fields ---
// !! VERIFY name="name" MATCHES YOUR HTML !!
const nameInput = document.querySelector('input[name="name"]');
const phoneInput = document.querySelector('input[name="phone_number"]');
const emailInput = document.querySelector('input[name="email"]');

const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzQxMTY1NDY5fQ.4MhbpCfZRv6MU_R_2t0nF4xSpkQYbXCjiNSzxU8AQOA';

// --- Helper function to convert ArrayBuffer to Hex String ---
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// --- Async SHA-256 Hashing Function ---
async function sha256(message) {
  try {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);
    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    // convert buffer to hex string
    const hashHex = bufferToHex(hashBuffer);
    return hashHex;
  } catch (error) {
    console.error("Hashing failed:", error);
    // Handle hashing error appropriately, maybe return null or throw
    return null; // Or throw new Error("Hashing failed");
  }
}


// --- Validation Functions (Unchanged) ---
function validateEmail() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput.value)) {
    document.getElementById('emailError').textContent = 'Invalid email.';
    emailInput.classList.add('invalid');
    return false;
  }
  document.getElementById('emailError').textContent = '';
  emailInput.classList.remove('invalid');
  return true;
}

function validatePhone() {
  const phoneRegex = /^\d{10}$/; // Assuming 10 digits exactly
  if (!phoneRegex.test(phoneInput.value)) {
    document.getElementById('phoneError').textContent = 'Invalid phone number.';
    phoneInput.classList.add('invalid');
    return false;
  }
  document.getElementById('phoneError').textContent = '';
  phoneInput.classList.remove('invalid');
  return true;
}

// --- Utility Function (Unchanged) ---
function getGclidFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('gclid');
}


// --- Form Submission Handler (MODIFIED) ---
// Make the event listener async to use await for hashing
form.addEventListener('submit', async function (event) {
  event.preventDefault(); // Prevent default form submission

  const gclid = getGclidFromUrl();
  if (!gclid) {
    document.getElementById('formError').textContent = 'Invalid request.';
    console.error('GCLID missing from URL.'); // Log error
    return;
  }

  // Perform validation (Add validation for name if needed)
  const isEmailValid = validateEmail();
  const isPhoneValid = validatePhone();
  // Add Name validation if required: const isNameValid = validateName();

  if (isEmailValid && isPhoneValid /* && isNameValid */ ) {
    document.getElementById('formError').textContent = ''; // Clear previous errors

    try {
      // Get the raw values from the form
      const rawName = nameInput.value;
      const rawEmail = emailInput.value;
      const rawPhone = phoneInput.value;

      // --- HASH THE VALUES using await ---
      const hashedName = await sha256(rawName);
      const hashedEmail = await sha256(rawEmail);
      const hashedPhone = await sha256(rawPhone);

      // Check if hashing was successful (sha256 function might return null on error)
      if (hashedName === null || hashedEmail === null || hashedPhone === null) {
          document.getElementById('formError').textContent = 'Could not process data. Please try again.';
          console.error("Hashing failed for one or more fields.");
          return; // Stop submission if hashing failed
      }

      // --- Construct the data object with HASHED values ---
      // IMPORTANT: Use the keys your backend API expects for these fields
      const dataToSend = {
        name: hashedName,         // Assuming backend expects 'name' key with hashed value
        email: hashedEmail,       // Assuming backend expects 'email' key with hashed value
        phone_number: hashedPhone,// Assuming backend expects 'phone_number' key with hashed value
        gclid: gclid
      };

      // --- Optional: Add other form fields if necessary ---
      // If you have other fields in your form that need to be sent as-is:
      // const formData = new FormData(form);
      // formData.forEach((value, key) => {
      //   if (!['name', 'email', 'phone_number'].includes(key)) {
      //     dataToSend[key] = value;
      //   }
      // });

      console.log("Sending Hashed Data:", dataToSend); // Log the data being sent (optional)

      // --- Send HASHED data to the backend ---
      const response = await fetch('https://35.200.153.166/allocate_voucher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(dataToSend), // Send the object with hashed values
        mode: 'cors'
      });

      // --- Handle Response (mostly unchanged) ---
      const responseData = await response.json(); // Try to parse JSON regardless of response.ok

      if (!response.ok) {
        const errorMessage = responseData.detail || 'Error submitting form. Please try again later.';
        document.getElementById('formError').textContent = errorMessage;
        throw new Error(`API Error (${response.status}): ${errorMessage}`); // Throw detailed error
      }

      // Success case
      if (responseData.voucher) {
        const voucherCode = responseData.voucher;
        const formContainer = document.querySelector(".form-container");
        // Replace form content with success message and voucher
        formContainer.innerHTML = `
                    <h4 class="text-center">Thank you for submitting!</h4>
                    <div class="alert alert-warning mt-3 text-center alert-dismissible fade show" role="alert">
                      <p class="info-text mb-0">
                        <b>Note:</b> Please save the Coupon code. You will not be able to retrieve it again.
                      </p>
                      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                      </button>
                    </div>
                    <div class="alert alert-info mt-3 text-center" role="alert" info-text>Your Coupon code is <strong>${voucherCode}</strong> </div>
                    <div class="store-locator-section mt-3 d-flex align-items-center justify-content-center">
                        <button type="button" class="btn" onclick="window.location.href='https://www.reliancedigital.in/collection/moto-razr?page_no=1&page_size=12&page_type=number'">
                            <i class="info-text" style="color:white";></i> <b>Click here to avail the Coupon!</b>
                        </button>
                    </div>
                    <div class="tnc mt-3 text-center info-text">
                        <h5 style="color: #000000; text-align: center;">Terms and Conditions</h5>
                        <div class="form-control" style="white-space: pre-wrap; overflow: auto; height: auto; font-size: 0.8rem; text-align: left;">
                            1. Coupon Applicable at <a href="https://www.reliancedigital.in" target="_blank">reliancedigital.in</a>.
                            2. Coupon also Applicable at <a href="https://www.reliancedigital.in/c/store-locator" target="_blank">Reliance Digital stores</a>
                            3. Coupon Valid till 31st March.
                            4. Terms and Conditions apply.
                        </div>
                    </div>
                `;
        // Trigger analytics conversion
        if (typeof gtag === 'function') {
          gtag('event', 'conversion', {
            'send_to': 'AW-996242825/Oy05CPK0l_8ZEInrhdsD',
            'value': 1.0,
            'currency': 'INR'
          });
        }
      } else {
        // API responded OK, but no voucher field in the response
        const apiMessage = responseData.detail || 'No voucher code available at the moment.';
        document.querySelector('.form-container').innerHTML = `<h2>${apiMessage}</h2>`;
      }

    } catch (error) {
      // Catch errors from fetch, hashing, or thrown API errors
      console.error('Error during form submission or fetch:', error);
      // Display a generic error if formError hasn't already been set by API response handling
      if (!document.getElementById('formError').textContent) {
           document.getElementById('formError').textContent = 'An unexpected error occurred. Please try again.';
      }
    }
  } else {
       console.log("Form validation failed.");
       // Ensure general form error message is cleared if specific field errors are shown
       document.getElementById('formError').textContent = '';
  }
});
