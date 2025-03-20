const form = document.getElementById('regForm');
const phoneInput = document.querySelector('input[name="phone_number"]');
const emailInput = document.querySelector('input[name="email"]');
const authToken='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzQxMTY1NDY5fQ.4MhbpCfZRv6MU_R_2t0nF4xSpkQYbXCjiNSzxU8AQOA'

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
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phoneInput.value)) {
    document.getElementById('phoneError').textContent = 'Invalid phone number.';
    phoneInput.classList.add('invalid');
    return false;
  }
  document.getElementById('phoneError').textContent = '';
  phoneInput.classList.remove('invalid');
  return true;
}

function getGclidFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('gclid');
}

form.addEventListener('submit', function (event) {
  event.preventDefault();

  const gclid = getGclidFromUrl();
  if (!gclid) {
    document.getElementById('formError').textContent = 'Invalid request.';
    return;
  }

  if (validateEmail() && validatePhone()) {
    const data = {};
    new FormData(form).forEach((value, key) => data[key] = value);
    data.gclid = gclid;

   //console.log("Captured Data:", data);

    fetch('/allocate_voucher', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(data),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { 
            const errorMessage = err.detail || 'Error submitting form. Please try again later.';
            document.getElementById('formError').textContent = errorMessage;
            throw new Error(errorMessage); 
        });
      }
      return response.json();
    })
    .then(responseData => {
      if (responseData.voucher) { 
        const voucherCode = responseData.voucher;

       // Select the form container and replace only its content
       const formContainer = document.querySelector(".form-container");
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
		    
		  <button type="button" class="btn" style="background-color: #004c99" onclick="window.location.href='https://www.reliancedigital.in/collection/moto-razr?page_no=1&page_size=12&page_type=number'">
		<i class="info-text" style="color:white";></i> <b>Click here to avail the Coupon.</b>
		</button>
		</div>
		<div class="tnc mt-3 text-center info-text">
		<h4 style="color: #000000; text-align: center;">Terms and Conditions</h4>
		<div class="form-control" style="white-space: pre-wrap; overflow: auto; height: auto; font-size: 0.8rem; text-align: left;">
		    1. Coupon Applicable only at <a href="https://www.reliancedigital.in" target="_blank">reliancedigital.in</a>. Coupon is not applicable at the Reliance Digital stores.<br>
		    2. Coupon Valid till 31st March.<br>
		    3. Terms and Conditions apply.
		</div>
        `;
      } else {
      const apiMessage = responseData.detail || 'No voucher code available at the moment.';

        document.querySelector('.form-container').innerHTML = `
          <h2>${apiMessage}</h2> 
        `;
	 gtag('event', 'conversion', {
      'send_to': 'AW-996242825/Oy05CPK0l_8ZEInrhdsD',
      'value': 1.0,
      'currency': 'INR'
         });
     // If no voucher, do nothing (or display a different message if needed)
      }
    })
    .catch(error => {
      console.error('Error sending form data:', error);
    });
  }
});
