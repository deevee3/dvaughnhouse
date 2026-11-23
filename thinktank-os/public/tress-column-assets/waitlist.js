(function(){
  "use strict";
/* ---------- waitlist form ---------- */
  var wlForm = document.getElementById("waitlist-form");
  if (wlForm) {
    var wlEmail = document.getElementById("wl-email");
    var wlName = document.getElementById("wl-name");
    var wlInterest = document.getElementById("wl-interest");
    var wlSubmit = document.getElementById("wl-submit");
    var wlStatus = document.getElementById("waitlist-status");
    function wlSet(msg, cls){
      wlStatus.textContent = msg;
      wlStatus.className = "waitlist-status" + (cls ? " " + cls : "");
    }
    wlForm.addEventListener("submit", function(event){
      event.preventDefault();
      var email = wlEmail.value.trim();
      var interest = wlInterest.value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        wlSet("Please enter a valid email address.", "err");
        wlEmail.focus();
        return;
      }
      if (!interest) {
        wlSet("Please choose what you are interested in.", "err");
        wlInterest.focus();
        return;
      }
      wlSubmit.disabled = true;
      wlSet("Joining…", "");
      fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          name: wlName.value.trim(),
          interest: interest,
          company: wlForm.querySelector('[name="company"]').value
        })
      }).then(function(resp){
        return resp.json().then(function(data){ return { status: resp.status, data: data }; });
      }).then(function(result){
        if (result.data && result.data.ok) {
          if (result.data.already_registered) {
            wlSet("You're already on the list — we'll email you when Tress Column opens.", "ok");
          } else {
            wlSet("You're on the list — we'll email you when Tress Column opens.", "ok");
          }
          wlForm.reset();
        } else if (result.status === 503) {
          wlSet("The waitlist isn't online yet — please try again later.", "err");
        } else if (result.status === 429) {
          wlSet("Too many signups from here — please try again later.", "err");
        } else {
          wlSet("Please check your email and interest and try again.", "err");
        }
      }).catch(function(){
        wlSet("Something went wrong — please try again.", "err");
      }).finally(function(){
        wlSubmit.disabled = false;
      });
    });
  }

})();
