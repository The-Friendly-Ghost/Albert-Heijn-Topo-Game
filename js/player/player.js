"use strict";

export class Player {
  constructor(sb, score) {
    this.score = score;
    this.name = "";
    this.sb = sb;
    this.highScores = {};
    this.elements = {
      scoreEl: document.getElementById("score-counter"),
      isHighScore: document.getElementById("is-highscore"),
      highScoreEl: document.getElementById("highscores"),
      submitHighScore: document.getElementById("submit-score-btn"),
      nameInput: document.getElementById("input-name"),
    };
    this.boundHandleSubmit = this.handleSubmit.bind(this);
    this.init();
  }

  async init() {
    this.hide(this.elements.isHighScore);
    this.updateScore();
    await this.getHighscores();
    this.showHighscores();
    this.checkHighScore();

    this.elements.submitHighScore.addEventListener(
      "click",
      this.boundHandleSubmit
    );
  }

  updateScore() {
    this.elements.scoreEl.textContent = this.score;
  }

  checkHighScore() {
    if (this.highScores.length < 5) {
      this.show(this.elements.isHighScore);
      return;
    }
    this.highScores.forEach((el) => {
      if (this.score > el.score) {
        this.show(this.elements.isHighScore);
      }
    });
  }

  async getHighscores() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await this.sb
      .from("highscores")
      .select("name, score")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("score", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching highscores:", error);
      return [];
    }
    console.log(data);
    this.highScores = data;
  }

  showHighscores() {
    const html = `  
        <table id="highscore-table">  
            <tr>  
                <th>Naam</th>  
                <th>Score</th>  
            </tr>  
            ${this.highScores
              .map(
                (el) => `  
                <tr>  
                    <td>${el.name}</td>  
                    <td>${el.score}</td>  
                </tr>  
            `
              )
              .join("")}  
        </table>  
    `;

    this.elements.highScoreEl.innerHTML = html;
  }

  async handleSubmit(e) {
    e.preventDefault();
    const name = this.elements.nameInput.value;
    if (!name) {
      console.log("Geen naam ingevuld");
      return;
    }
    this.name = name;
    try {
      const { error } = await this.sb
        .from("highscores")
        .insert({ name: this.name, score: this.score });

      if (error) throw error;

      // refresh html
      await this.getHighscores();
      this.showHighscores();
      this.hide(this.elements.isHighScore);

      // Clear input en verwijder listener
      this.elements.nameInput.value = "";
      this.elements.submitHighScore.removeEventListener(
        "click",
        this.boundHandleSubmit
      );
    } catch (error) {
      console.error("Error submitting score:", error);
    }
  }

  setName(name) {
    const newName = this.elements.nameInput.textContent;
    if (newName !== "") this.name = name;
  }

  hide(el) {
    el.classList.add("hidden");
  }

  show(el) {
    el.classList.remove("hidden");
  }
}
