document
  .getElementById("donationForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const amount = document.getElementById("amount").value;
    fetch("http://localhost:3000/donate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: amount }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      })
      .catch((error) => console.error("Error:", error));
  });
