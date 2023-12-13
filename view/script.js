document.addEventListener("DOMContentLoaded", function () {
  fetchProvinces();

  document
    .getElementById("registerForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      registerUser();
    });
});

function fetchProvinces() {
  fetch("http://localhost:3000/province")
    .then((response) => response.json())
    .then((responseObject) => {
      const provinces = responseObject.data;
      provinces.forEach((province) => {
        const option = document.createElement("option");
        option.value = province.ProvinceID;
        option.textContent = province.Name;
        document.getElementById("provinceId").appendChild(option);
      });
    })
    .catch((error) => console.error("Error fetching provinces:", error));
}

function registerUser() {
  const userData = {
    username: document.getElementById("username").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    provinceId: document.getElementById("provinceId").value,
    additionalInfo: document.getElementById("additionalInfo").value,
  };

  fetch("http://localhost:3000/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        alert("Registration successful");
        // Redirect to login page or home page
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error registering user");
    });
}
