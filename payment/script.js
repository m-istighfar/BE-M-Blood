// document
//   .getElementById("donationForm")
//   .addEventListener("submit", function (e) {
//     e.preventDefault();

//     const formData = {
//       firstName: document.getElementById("firstName").value,
//       lastName: document.getElementById("lastName").value,
//       email: document.getElementById("email").value,
//       phone: document.getElementById("phone").value,
//       amount: document.getElementById("amount").value,
//     };

//     fetch("http://localhost:3000/donate", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(formData),
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         if (data.redirectUrl) {
//           window.location.href = data.redirectUrl;
//         }
//       })
//       .catch((error) => console.error("Error:", error));
//   });
