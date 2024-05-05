import { html, render, Component } from '../js/preact-htm.js'
import Response  from './Response.js'

const human_message = `Who is Jame T Kirk`

class Prompt extends Component {
  setRefResponse = (dom) => this.refResponse = dom

    constructor(props) {
        super()
        this.state = {
            aborter: new AbortController(),
            humanMessage: human_message,
        }

        this.btnSubmitOnClick = this.btnSubmitOnClick.bind(this)
        this.btnStopOnClick = this.btnStopOnClick.bind(this)    
        this.btnClearAnswerOnClick = this.btnClearAnswerOnClick.bind(this)

        this.txtHumanMessageOnChange = this.txtHumanMessageOnChange.bind(this)
        
    }

    txtHumanMessageOnChange(e) {
        // triggered by the textarea of the human message
        this.setState({ humanMessage: e.target.value })
    }

    btnClearAnswerOnClick() {
        //this.ref_txtResponse.innerHTML = ""
        this.refResponse.changeResponseContent("")

    }

    btnStopOnClick() {
        console.log("🛑 Stop: clicked")
        this.state.aborter.abort()
    }

    async btnSubmitOnClick() {

        console.log("🤓 Prompt: clicked")
        console.log("(ref)txtResponse", this.ref_txtResponse)
        console.log("(ref)msgHeader", this.ref_msgHeader)

        // 🫢 this is a hack
        var that = this

        let responseText=""

        try {
            let waitingTimer = setInterval(waitingMessage, 500)
            let waiting = true
        
            function waitingMessage() {
              const d = new Date()
              // 🫢 I use the hack here
              that.refResponse.changeMsgHeaderText("🤖 Answer: 🤔 computing " + d.toLocaleTimeString())
              //that.ref_msgHeader.innerHTML = "🤖 Answer: 🤔 computing " + d.toLocaleTimeString()
            }

            const response = await fetch("/prompt", {
              method: "POST",
              headers: {
                "Content-Type": "application/json;charset=utf-8",
              },
              body: JSON.stringify({
                question: this.state.humanMessage,
              }),
              signal: this.state.aborter.signal,
            })
      
            const reader = response.body.getReader()
      
            while (true) {
              const { done, value } = await reader.read()
      
              if (waiting) {
                clearInterval(waitingTimer)
                waiting = false
                this.refResponse.changeMsgHeaderText("🤖 Answer:")
              }
              
              if (done) {
                responseText = responseText + "\n"
                this.refResponse.changeResponseContent(markdownit().render(responseText))
                return
              }
              // Otherwise do something here to process current chunk
              const decodedValue = new TextDecoder().decode(value)
              console.log(decodedValue)
              responseText = responseText + decodedValue
              this.refResponse.changeResponseContent(markdownit().render(responseText))

            }
      
          } catch(error) {
            
            if (error.name === 'AbortError') {
                console.log("✋", "Fetch request aborted")
                //txtPrompt.value = ""
                //aborter = new AbortController()
                this.setState({ aborter: new AbortController() })
    
                try {
                  const response = await fetch("/cancel-request", {
                    method: "DELETE",
                  })
                  console.log(response)
                } catch(error) {
                  console.log("😡", error)
                }
    
              } else {
                console.log("😡", error)
              }
          }

    }

    render() {
        return html`
        <div>

          <div class="field">
              
              <label class="label">
                  <span class="tag is-primary">Prompt:</span>
              </label>
              <div class="control">
                  <textarea id="human-message" 
                  class="textarea is-success is-family-code" 
                  rows="2"
                  value=${this.state.humanMessage} 
                  onInput=${this.txtHumanMessageOnChange}
                  placeholder="Type your question here"/>
              </div>

          </div>  

          <div class="content">
              <div class="field is-grouped">
                  <div class="control">
                      <button class="button is-link is-small" onclick=${this.btnSubmitOnClick}>Submit</button>
                  </div>
                  <div class="control">
                      <button class="button is-link is-danger is-small" onclick=${this.btnStopOnClick}>Stop</button>
                  </div>

                  <div class="control">
                      <button class="button is-link is-info is-small" onclick=${this.btnClearAnswerOnClick}>Clear the answer</button>
                  </div>
      
              </div>
          </div>

          <${Response} ref=${this.setRefResponse}/>
        </div>
        `
    }
}

export default Prompt
