import { html, render, Component } from '../js/preact-htm.js'

class Title extends Component {
  constructor(props) {
    super()
    this.state = {}
  }
  render() {
    return html`
    <div class="hero-body">
        <p class="title is-3">
        🩵 GoLang 🐳 Docker 🦙 GenAI Stack 🦜🪺
        </p>
        <p class="title is-4">
        Simple completion
        </p>
    </div>
    `
  }
}
//render(html`<${ApplicationTitle}/>`, document.getElementById("app"));

export default Title
