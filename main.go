package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"

	"github.com/parakeet-nest/parakeet/completion"
	"github.com/parakeet-nest/parakeet/llm"
)

/*
GetBytesBody returns the body of an HTTP request as a []byte.
  - It takes a pointer to an http.Request as a parameter.
  - It returns a []byte.
*/
func GetBytesBody(request *http.Request) []byte {
	body := make([]byte, request.ContentLength)
	request.Body.Read(body)
	return body
}

func main() {

	var ollamaUrl = os.Getenv("OLLAMA_BASE_URL")
	if ollamaUrl == "" {
		ollamaUrl = "http://localhost:11434"
	}

	var httpPort = os.Getenv("HTTP_PORT")
	if httpPort == "" {
		httpPort = "8080"
	}

	var model = os.Getenv("LLM")
	if model == "" {
		model = "tinydolphin"
	}

	options := llm.Options{
		Temperature: 0.5, // default (0.8)
	}

	mux := http.NewServeMux()

	fileServerHtml := http.FileServer(http.Dir("public"))
	mux.Handle("/", fileServerHtml)

	shouldIStopTheCompletion := false
	var conversationalContext []int

	mux.HandleFunc("GET /model", func(response http.ResponseWriter, request *http.Request) {
		response.Write([]byte("🤖 LLM: " + model))
	})

	// Cancel/Stop the generation of the completion
	mux.HandleFunc("DELETE /cancel-request", func(response http.ResponseWriter, request *http.Request) {
		shouldIStopTheCompletion = true
		response.Write([]byte("🚫 Cancelling request..."))
	})

	mux.HandleFunc("/prompt", func(response http.ResponseWriter, request *http.Request) {
		// add a flusher
		flusher, ok := response.(http.Flusher)
		if !ok {
			response.Write([]byte("😡 Error: expected http.ResponseWriter to be an http.Flusher"))
		}

		body := GetBytesBody(request)

		// unmarshal the json data
		var data map[string]string

		err := json.Unmarshal(body, &data)
		if err != nil {
			response.Write([]byte("😡 Error: " + err.Error()))
		}

		questionFromWebApp := data["question"]

		query := llm.GenQuery{
			Model:   model,
			Prompt:  questionFromWebApp,
			Options: options,
			Context: conversationalContext,
		}

		answer, err := completion.GenerateStream(ollamaUrl, query,
			func(answer llm.GenAnswer) error {
				log.Println("📝:", answer.Response)
				response.Write([]byte(answer.Response))
				flusher.Flush()
				if !shouldIStopTheCompletion {
					return nil
				} else {
					return errors.New("🚫 Cancelling request")
				}
			})

		if err != nil {
			shouldIStopTheCompletion = false
			response.Write([]byte("bye: " + err.Error()))
		}
		// keep the las context
		conversationalContext = answer.Context

	})
	var errListening error
	log.Println("🌍 http server is listening on: " + httpPort)
	errListening = http.ListenAndServe(":"+httpPort, mux)

	log.Fatal(errListening)
}
