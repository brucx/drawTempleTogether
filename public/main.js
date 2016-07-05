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