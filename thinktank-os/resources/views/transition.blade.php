<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>D'Vaughn House has moved to Glenride</title>
<meta name="description" content="D'Vaughn House has moved to Glenride. This page will stop being active. Redirecting to glenride.com.">
<link rel="preconnect" href="https://fonts.bunny.net">
<link href="https://fonts.bunny.net/css?family=bricolage-grotesque:700,800|newsreader:400,500,600" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #FAF5EC; color: #221D18; font-family: "Newsreader", Georgia, serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  main { max-width: 640px; text-align: center; }
  .kicker { font-family: "Bricolage Grotesque", system-ui, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: .22em; color: #B84A2B; text-transform: uppercase; }
  h1 { font-family: "Bricolage Grotesque", system-ui, sans-serif; font-size: clamp(40px, 8vw, 64px); line-height: 1.05; margin: 16px 0 0; }
  p.lede { font-size: 21px; line-height: 1.55; margin: 20px 0 0; }
  .count { font-family: "Bricolage Grotesque", system-ui, sans-serif; font-size: 96px; font-weight: 800; line-height: 1; color: #B84A2B; margin: 36px 0 8px; }
  .redirect { font-size: 17px; color: #57504A; margin: 0; }
  a.button { display: inline-block; margin-top: 32px; background: #B84A2B; color: #FAF5EC; font-family: "Bricolage Grotesque", system-ui, sans-serif; font-size: 17px; font-weight: 700; padding: 14px 28px; border-radius: 999px; text-decoration: none; }
  a.button:hover { background: #9c3d24; }
  p.small { font-size: 15px; color: #57504A; margin: 40px 0 0; }
</style>
</head>
<body>
<main>
  <div class="kicker">D'Vaughn House</div>
  <h1>This home has moved.</h1>
  <p class="lede">Glenride is now the home for my work. This page will stop being active, so I am sending you to glenride.com.</p>
  <div class="count" id="count">10</div>
  <p class="redirect">Redirecting to Glenride.com in <span id="seconds">10</span> seconds.</p>
  <a class="button" href="https://glenride.com/">Go to Glenride now</a>
  <p class="small">Glenride is an independent, AI-native think tank. Built to be checked.</p>
</main>
<script>
  (function () {
    var n = 10;
    var count = document.getElementById('count');
    var seconds = document.getElementById('seconds');
    var t = setInterval(function () {
      n -= 1;
      if (n <= 0) {
        clearInterval(t);
        window.location.replace('https://glenride.com/');
      } else {
        count.textContent = n;
        seconds.textContent = n;
      }
    }, 1000);
  })();
</script>
</body>
</html>
