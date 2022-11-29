const rwClient = require("./twitterClient.js")
const CronJob = require("cron").CronJob
const axios = require("axios")
const express = require("express")

const app = express()
let pastEvents = null

app.get("/", (req, res) => {
  res.sendStatus(200)
})

app.listen(3000)

const tweet = async (text) => {
  try {
    await rwClient.v2.tweet(text)
    console.log(`Tweet send: ${text}`)
  } catch (err) {
    console.error(err)
  }
}

const getEvents = async () => {
  const response = await axios.get('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard')

  if (response.status === 200) {
    const eventsNow = response.data.events
    return eventsNow
  }
}

const job = new CronJob("*/5 * * * *", async () => {
    const response = await getEvents()
    let elementos = null

    if (pastEvents) {
        elementos = response.filter((match, index) => match.status.type.name === "STATUS_FINAL" && pastEvents[index].status.type.name === "STATUS_IN_PROGRESS")
    }

    if (elementos) {
      console.log(`Total de elementos: ${elementos.length}`)
      elementos.forEach(function(elemento, index) {
        let wins = ''
        if (elemento.competitions[0].competitors[0].winner) {
          wins = `${elemento.competitions[0].competitors[0].team.displayName} WINS!`
        } else {
          wins = `${elemento.competitions[1].competitors[0].team.displayName} WINS`
        }

        setTimeout(async function(){
          await tweet(`${wins}\n\n${elemento.competitions[0].competitors[0].team.displayName} - ${elemento.competitions[0].competitors[0].score}\n${elemento.competitions[0].competitors[1].team.displayName} - ${elemento.competitions[0].competitors[1].score}\n\n${elemento.competitions[0].competitors[0].leaders[3].leaders[0].athlete.displayName} - ${elemento.competitions[0].competitors[0].leaders[3].leaders[0].displayValue}\n${elemento.competitions[0].competitors[1].leaders[3].leaders[0].athlete.displayName} - ${elemento.competitions[0].competitors[1].leaders[3].leaders[0].displayValue}`)
        }, 5000 * (index + 1));
      }) 
    } else {
        console.log('Sem elementos')
    }

    pastEvents = response
})

job.start()