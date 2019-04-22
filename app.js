const puppeteer = require("puppeteer");
const discord = require("discord.js");
const getJSON = require("get-json");
const numeral = require("numeral");
const iv = require("implied-volatility");
const bs = require("black-scholes");

const discord_client = new discord.Client();

discord_client.on("ready", () => {
  console.log("Connected as: " + discord_client.user.tag);
});

discord_client.on("message", receivedMessage => {
  // Prevent bot from responding to its own messages
  if (receivedMessage.author == discord_client.user) {
    return;
  }
  if (receivedMessage.content.startsWith("!")) {
    processCommand(receivedMessage);
  }
});

function processCommand(receivedMessage) {
  let fullCommand = receivedMessage.content.substr(1); // Remove the leading exclamation mark
  let splitCommand = fullCommand.split(" "); // Split the message up in to pieces for each space
  let botID = splitCommand[0]; // The first word directly after the exclamation is the command
  let arguments = splitCommand.slice(1); // All other words are arguments/parameters/options for the command
  let ltp;
  let doHelp = false;
  let doBs = false;
  let help;
  let bitbookSymbol;

  if (arguments === "help" || arguments.length === 0) {
    doHelp = true;
    if (botID == "GS9") {
      ltp = 5152;
      help =
        "Gann9 Bot by DaveStewart#0241 V1.0\n" +
        "Lets say you have a LTP price at 5152.\n" +
        "You enter the price in !GS9 5152\n" +
        "You will get the square that looks like below \n" +
        "5152 falls between 5166 and 5148.\n" +
        "So we should buy above 5166 and sell below 5148.\n" +
        "Targets are next levels in the calculator.\n" +
        "Now lets say 1st target is achieved.(5181)\n" +
        "Then we we watch whether price is able to sustain above 5181 for more than 5 min.\n" +
        "If it sustains, we continue our long position. If not, we square off.\n\n" +
        "But how to find the targets.?\n" +
        "For Buy, we go in clockwise direction from the Yellow LTP box\n" +
        "For Sell, we go in an anticlockwise direction.\n\n" +
        "Clockwise targets are resistances for Buy. \n" +
        "Anticlockwise are support for Sell.\n" +
        "Targets are 99.95% of resistance and 100.05% of support.\n" +
        "So Target for Buy = resistance * 0.9995. \n" +
        "Target for Sell = support * 1.0005.";
    } else if (botID == "bitbook") {
      help =
        "Usage: !bitbook <symbol>\n" +
        "Available symbols on Bitmex: XBT, ADA, BCH, ETH, LTC, EOS, TRX, XRP";
    } else if (botID == "oiv") {
      help =
        "Determine implied volatility of options based on their prices\n" +
        "Expected Cost - The market price of the option \n" +
        "s - Current price of the underlying \n" +
        "k - Strike price \n" +
        "t - Time to experiation in years (can be decimal)\n" +
        "r - Anual risk-free interest rate as a decimal \n" +
        'CallPut - The type of option priced - "call" or "put" \n' +
        "Input as a list delimted with spaces\n" +
        "Example: !oiv 2 101 100 0.1 0.0015 call\n" +
        "To verify your result using Black-Scholes Model\n" +
        "Example: !oiv 101 100 0.1 YOUR_IV_RESULT 0.0015 call bs";
    }
  } else {
    if (botID == "oiv") {
      // Black Scholes
      if (arguments[arguments.length - 1] === "bs") {
        arguments.pop();
        var callput = arguments.pop().toString();
        arguments = arguments.map(Number);
        arguments.push(callput);
        doBs = true;
      } else {
        doBs = false;
        var callput = arguments.pop().toString();
        //callput = callput.replace(/'/g, '"');
        arguments = arguments.map(Number);
        arguments.push(callput);
      }
    }
    ltp = arguments;
    doHelp = false;
  }

  //console.log("Command received: " + botID);
  //console.log("Arguments: " + arguments); // There may not be any arguments

  if (botID == "GS9") {
    var squareAry = [
      24,
      23,
      16,
      17,
      18,
      25,
      32,
      31,
      30,
      29,
      22,
      15,
      8,
      9,
      10,
      11,
      12,
      19,
      26,
      33,
      40,
      39,
      38,
      37,
      36,
      35,
      28,
      21,
      14,
      7,
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      13,
      20,
      27,
      34,
      41,
      48,
      47,
      46,
      45,
      44,
      43,
      42
    ];
    var idxArray = [
      23,
      16,
      17,
      18,
      25,
      32,
      31,
      30,
      22,
      8,
      10,
      12,
      26,
      40,
      38,
      36,
      21,
      0,
      3,
      6,
      27,
      48,
      45,
      42
    ];
    var green = [0, 6, 8, 12, 16, 18, 30, 32, 36, 40, 42, 48];

    let next = 0;
    let sqt = Math.sqrt(ltp);
    //console.log("lpt sqt: ", sqt);
    let flr = Math.floor(sqt);
    //console.log("flr: ", flr);
    let down = flr - 1;
    //console.log("down: ", down);
    let ary = new Array();
    let ary2 = new Array();
    let center = Math.pow(down, 2);
    ary.push({ idx: 24, value: center });
    //console.log("center: ", center);
    next = down + 0.125;
    let rows = 7;

    for (let i = 0; i < idxArray.length; i++) {
      let nextSqr = Math.pow(next, 2);
      nextSqr = Math.floor(nextSqr * 100) / 100;
      ary.push({ idx: idxArray[i], value: nextSqr });
      next += 0.125;
    }

    var stop = false;
    var lptId = 0;

    var recommend = [
      {
        above: 0,
        targets: [],
        stop: 0
      },
      {
        below: 0,
        targets: [],
        stop: 0
      }
    ];

    var t1, t2, t3, t4;
    for (i = 0; i < ary.length - 1; i++) {
      if (ltp > ary[i].value && ltp < ary[i + 1].value && !stop) {
        lptId = ary[i].idx;
        //console.log("lptId: ", lptId);
        recommend[0].above = ary[i + 1].value;
        t1 = parseFloat((ary[i + 2].value * 0.9995).toFixed(2));
        t2 = parseFloat((ary[i + 3].value * 0.9995).toFixed(2));
        t3 = parseFloat((ary[i + 4].value * 0.9995).toFixed(2));
        t4 = parseFloat((ary[i + 5].value * 0.9995).toFixed(2));
        recommend[0].targets.push(t1, t2, t3, t4);
        recommend[0].stop = ary[i].value;

        recommend[1].below = ary[i].value;
        t1 = parseFloat((ary[i - 1].value * 1.0005).toFixed(2));
        t2 = parseFloat((ary[i - 2].value * 1.0005).toFixed(2));
        t3 = parseFloat((ary[i - 3].value * 1.0005).toFixed(2));
        t4 = parseFloat((ary[i - 4].value * 1.0005).toFixed(2));
        recommend[1].targets.push(t1, t2, t3, t4);
        recommend[1].stop = ary[i + 1].value;
        stop = true;
      }
    }

    var idx1;
    for (let i = 0; i < squareAry.length; i++) {
      if (squareAry[i] === lptId) {
        idx1 = squareAry[i + 1];
      }
      for (let j = 0; j < ary.length; j++) {
        if (ary[j].idx === squareAry[i]) {
          var id = squareAry[i];
          squareAry[i] = { idx: id, value: ary[j].value };
        }
      }
    }
    for (let i = 0; i < squareAry.length; i++) {
      if (squareAry[i] === idx1) {
        squareAry[i] = { idx: idx1, value: parseFloat(ltp) };
      }
      if (!isNaN(squareAry[i])) {
        var id = squareAry[i];
        squareAry[i] = { idx: id, value: -1 };
      }
    }
    squareAry.sort((a, b) => parseFloat(a.idx) - parseFloat(b.idx));
    //console.log(squareAry);

    let htmlString =
      "<style>" +
      "table {" +
      "width: 100%;" +
      "height: 100%;" +
      "background-color: rgb(67.9%, 28.6%, 28.6%);" +
      "}" +
      "table," +
      "td {" +
      "border: 1px solid rgb(36.2%, 3.5%, 3.5%);" +
      "border-collapse: collapse;" +
      "padding: 5px;" +
      "text-align: center;" +
      "background-color: rgb(67.9%, 28.6%, 28.6%);" +
      "color: white;" +
      "font-weight: bold;" +
      "font-family: Arial, Helvetica, sans-serif;" +
      "}" +
      "table," +
      "td {" +
      "}" +
      "</style>" +
      "<table id='results_table'><tbody>";

    var count = 0;
    for (let j = 0; j < 7; j++) {
      htmlString += "<tr>";
      for (let k = 0; k < 7; k++) {
        if (squareAry[count].value === -1) {
          htmlString +=
            "<td style='background-color:rgb(66.7%, 10.6%, 10.6%);color:white;'></td>";
        } else {
          if (squareAry[count].idx === idx1) {
            htmlString +=
              "<td style='background-color:rgb(88.6%, 78%, 21%);color:black;line-height: 13px;'>" +
              squareAry[count].value +
              "</br>ltp</td>";
          } else {
            if (squareAry[count].idx === 24) {
              htmlString +=
                "<td style='background-color:rgb(67.9%, 28.6%, 28.6%);color:white;'>" +
                squareAry[count].value +
                "</td>";
            } else {
              var iddx = squareAry[count].idx;
              var target = green.includes(iddx);
              var color = target
                ? "rgb(18.9%, 48%, 18.9%)"
                : "rgb(54%, 7.4%, 83.5%)";
              htmlString +=
                "<td style='background-color:" +
                color +
                ";color:white;'>" +
                squareAry[count].value +
                "</td>";
            }
          }
        }
        count++;
      }
      htmlString += "</tr>";
    }
    htmlString += "</td></tr></tbody></table>";

    //console.log(html);
    if (doHelp) {
      receivedMessage.channel.send(help);
    }

    var recommendString =
      "Bot by DaveStewart#0241 V1.0\n" +
      "Recommendations:\n" +
      "Buy at / above: " +
      recommend[0].above +
      "\nTargets: " +
      recommend[0].targets[0] +
      " - " +
      recommend[0].targets[1] +
      " - " +
      recommend[0].targets[2] +
      " - " +
      recommend[0].targets[3] +
      "\nStoploss : " +
      recommend[0].stop +
      "\nSell at / below: " +
      recommend[1].below +
      "\nTargets: " +
      recommend[1].targets[0] +
      " - " +
      recommend[1].targets[1] +
      " - " +
      recommend[1].targets[2] +
      " - " +
      recommend[1].targets[3] +
      "\nStoploss : " +
      recommend[1].stop;

    (async () => {
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });
      const page = await browser.newPage();
      await page.setContent(htmlString);
      //await page.screenshot({ path: "GS9.png" });
      await page.screenshot({ path: "GS9.png" }).then(function(buffer) {
        const localFileAttachment = new discord.Attachment("GS9.png");
        receivedMessage.channel.send(localFileAttachment);
        receivedMessage.channel.send(recommendString);
      });
      await browser.close();
    })();
  } else if (botID == "bitbook") {
    var isUSD = true;
    if (arguments.length === 0) {
      bitbookSymbol = "XBTUSD";
    } else {
      bitbookSymbol = arguments[0].toUpperCase();
      switch (bitbookSymbol) {
        case "XBT":
          bitbookSymbol = "XBTUSD";
          break;
        case "ETH":
          bitbookSymbol = "ETHUSD";
          break;
        default:
          isUSD = false;
      }
    }

    function formatPrice(response, idx) {
      var price = isUSD
        ? numeral(response[idx].price).format("($0.00a)")
        : response[idx].price + " Sats";
      return price;
    }

    getJSON(
      "https://www.bitmex.com/api/v1/orderBook/L2?symbol=" +
        bitbookSymbol +
        "&depth=0"
    )
      .then(function(response) {
        response.sort(
          sort_by("side", {
            name: "size",
            primer: parseInt,
            reverse: true
          })
        );

        var resp =
          "Bot by DaveStewart#0241 V1.0\nBitmex " +
          bitbookSymbol +
          " Order Book as of " +
          new Date() +
          "\n";

        resp +=
          "Largest Buy Wall: " +
          numeral(response[0].size).format("( 0.0a)") +
          " @: " +
          formatPrice(response, 0);

        const sIndex = response.findIndex(item => item.side === "Sell");

        resp +=
          "\nLargest Sell Wall: " +
          numeral(response[sIndex].size).format("( 0.0a)") +
          " @: " +
          formatPrice(response, sIndex);

        receivedMessage.channel.send(resp);
      })
      .catch(function(error) {
        console.log(error);
        //receivedMessage.channel.send(error);
      });
  } else if (botID == "oiv") {
    if (doHelp) {
      receivedMessage.channel.send(help);
    } else {
      if (doBs) {
        oiv_value = bs.blackScholes(
          arguments[0],
          arguments[1],
          arguments[2],
          arguments[3],
          arguments[4],
          arguments[5]
        );
        receivedMessage.channel.send("Black-Scholes IV: " + oiv_value);
      } else {
        oiv_value = iv.getImpliedVolatility(
          arguments[0],
          arguments[1],
          arguments[2],
          arguments[3],
          arguments[4],
          arguments[5]
        );
        receivedMessage.channel.send("Implied Volatility: " + oiv_value);
      }
    }
  } else {
    receivedMessage.channel.send("Did not understand command.");
  }
}

// utility functions
function default_cmp(a, b) {
  if (a == b) return 0;
  return a < b ? -1 : 1;
}

function getCmpFunc(primer, reverse) {
  var cmp = default_cmp;
  if (primer) {
    cmp = function(a, b) {
      return default_cmp(primer(a), primer(b));
    };
  }
  if (reverse) {
    return function(a, b) {
      return -1 * cmp(a, b);
    };
  }
  return cmp;
}

function sort_by() {
  var fields = [],
    n_fields = arguments.length,
    field,
    name,
    reverse,
    cmp;

  // preprocess sorting options
  for (var i = 0; i < n_fields; i++) {
    field = arguments[i];
    if (typeof field === "string") {
      name = field;
      cmp = default_cmp;
    } else {
      name = field.name;
      cmp = getCmpFunc(field.primer, field.reverse);
    }
    fields.push({
      name: name,
      cmp: cmp
    });
  }

  return function(A, B) {
    var a, b, name, cmp, result;
    for (var i = 0, l = n_fields; i < l; i++) {
      result = 0;
      field = fields[i];
      name = field.name;
      cmp = field.cmp;

      result = cmp(A[name], B[name]);
      if (result !== 0) break;
    }
    return result;
  };
}
// Bot token is retrieved from Heroku config vars
discord_client.login(process.env.BOT_TOKEN);
