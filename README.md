[TOC]

#### CryptoBots

Discord 3 (so far) in 1 Crypto Bot.

**Gann Square 9 generator bot for BTC.**

- Discord usage: !GS9 `<last traded price>`

**Bitmex current largest Buy and Sell wall.**

- Discord usage: !bitbook

**Options implied Volatility.**

- Discord usage:

  Expected Cost - The market price of the option
  
  s - Current price of the underlying
  
  k - Strike price
  
  t - Time to experiation in years (can be decimal)
  
  r - Anual risk-free interest rate as a decimal
  
  CallPut - The type of option priced - "call" or "put"
  
  Input as a list delimted with spaces
  
  Example: !oiv 2 101 100 0.1 0.0015 call
  
  To verify your result using Black-Scholes Model
  
  Example: !oiv 101 100 0.1 YOUR_IV_RESULT 0.0015 call bs

#### Heroku Installation

Download or clone this repo.
In a terminal, CD to this directory.

Using the Heroku CLI, login and create a new application.

`git init`

`heroku git:remote -a your-app-name`

`git add .`

`git commit -am "make it better"`

`git push heroku master`

This source has to be run as a worker Dyno, not a web Dyno.
The code in the provided Procfile should handle this automatically.

#### Discord Installation

In a web browser, navigate to https://discordapp.com/developers and login.
Create a new application & follow the instructions to complete this.
Don't change any of the settings, just create a **CLIENT ID** and copy it to a textfile for later use.

From within this new applications menu, click Bots and create a new bot. Give it a name and icon.
Don't change any of the settings, just create a **Token** and copy it to a textfile for later use.

From your Heroku account page, go to the applications page, click Settings and from there, click **Reveal Config Vars**. Add a new var: `BOT_TOKEN`
The value of this token should be the copied bot **token** we grabbed earlier.

While still in settings, click **Add Buildpack** and add:
https://github.com/jontewks/puppeteer-heroku-buildpack
This is required because the GS9 bot creates HTML that needs screenshot to deliver an image to the discord channel. Pupeteer fires up an instance of Chromium to render this DOM element to a PNG file.
That's it for Heroku.

In that text file you created earlier, jot down this URL and place the copied **CLIENT ID** inside it, like so:
https://discordapp.com/api/oauth2/authorize?client_id=PUT_CLIENT_ID_HERE&scope=bot&permissions=0

Next, paste this url into the browser and you will be directed to a page that asks you to Authenticate this bot with your Discord server. Of course you must have Admin privelages on the channel to do this.
If all goes well, your new bot should come on-line from within your channel.

If it does not respond as expected, from your Heroku app dashboard page, view the logs and see if there was an error building or deploying or running your bot. Your on your own to figure out any errors from here though. Sometimes it goes smooth, others not so much.

Good Luck.
