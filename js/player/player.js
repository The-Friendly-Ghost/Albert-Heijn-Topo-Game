"use strict";

export class Player {
  constructor() {
    this.score = 0;
    this.name = "";
    this.sb = supabase.createClient("URL", "KEY");
    this.highScores = {};
    this.elements = {
      scoreEl: document.getElementById("score-counter"),
      isHighScore: document.getElementById("is-highscore"),
      highScoreEl: document.getElementById("highscores"),
      submitHighScore: document.getElementById("submit-score-btn"),
    };
    this.boundHandleSubmit = this.handleSubmit.bind(this);
    this.init();
  }

  async init() {
    this.hide(this.elements.highScoreEl);
    this.updateScore();
    await this.getHighscores();
    this.showHighscores();
    this.checkHighScore();
  }

  updateScore() {
    this.elements.scoreEl.textContent = this.score;
  }

  checkHighScore() {
    if (this.highScores.length < 10) {
      this.show(this.elements.highScoreEl);
      return;
    }
    this.highScores.forEach((el) => {
      if (this.score > el.score) {
        this.show(this.elements.highScoreEl);
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

  handleSubmit() {
    this.elements.submitHighScore.addEventListener("click", async (e) => {
      const { error } = await supabase
        .from("highscores")
        .insert({ name: this.name, score: this.score });
    });
  }

  showHighscores() {
    this.highScores.forEach((el) => {
      const html = `<p>${el.name} - ${el.score}</p>`;
      this.elements.highScoreEl.insertAdjacentHTML("beforeend", html);
    });
  }

  setName(name) {
    this.name = name;
  }

  hide(el) {
    el.classList.add("hidden");
  }

  show(el) {
    el.classList.remove("hidden");
  }
}
