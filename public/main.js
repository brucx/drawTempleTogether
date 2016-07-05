/**
 * Created by Bruce on 16/7/5.
 */

function setStatus(status) {
  window.inkpeking = {
    name: status
  };
  $('iframe')[0].src="frame.html";
  if(status === "drawer") {
    
  } else {
    
  }
}

// Bing Speech API

var speech_client;
var request;

speech_client = Microsoft.ProjectOxford.SpeechRecognition.SpeechRecognitionServiceFactory.createMicrophoneClient(
  getMode(),
  getLanguage(),
  getOxfordKey(),
  getOxfordKey());

function getMode() {
  return Microsoft.ProjectOxford.SpeechRecognition.SpeechRecognitionMode.shortPhrase;
}

function getOxfordKey() {
  return "8e985c27639d4370a6705161c7182f53";
}

function getLanguage() {
  return "en-us";
}

function clearText() {
  document.getElementById("output").value = "";
}

function setText(text) {
  document.getElementById("output").value += text;
}

function start() {
  clearText();

  speech_client.startMicAndRecognition();
  setTimeout(function () {
    speech_client.endMicAndRecognition();
  }, 2000);

  speech_client.onPartialResponseReceived = function (response) {
    setText(response[0].lexical);
  }

  speech_client.onFinalResponseReceived = function (response) {
    setText(response[0].lexical);
  }

  speech_client.onIntentReceived = function (response) {
    setText(response[0].lexical);
  };

}
