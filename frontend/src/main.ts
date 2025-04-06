fetch("http://localhost:1337/api/words")
  .then((res) => res.json())
  .then((data) => {
    console.log("API response:", data);

    const list = document.createElement("ul");

    data.data.forEach((word: any) => {
      const li = document.createElement("li");
      li.textContent = `${word.english} - ${word.translation}`;
      list.appendChild(li);
    });

    document.body.appendChild(list);
  })
  .catch((error) => {
    console.error("Błąd w fetchu:", error);
  });
