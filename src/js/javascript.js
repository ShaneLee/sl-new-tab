loadJSon()

document.addEventListener('keydown', (event) => {
  if (event.key === '~') {
    document.getElementById('main').style.display = 'none'
  }
})


function loadJSon() {
	const request = new XMLHttpRequest()
	const requestURL = '../data/quotes.json'
	request.open('GET', requestURL)
	request.responseType = 'json'
	request.send()
	request.onload = () => {
		const quotes = request.response
		getQuote(quotes)
		deathCountdown()
	}
}

function getQuote(jsonObj) {
  const randomQuote = pickRandom(jsonObj.quotes) 
  printQuote(randomQuote.author, randomQuote.quote)
}

function pickRandom(quotes) {
	return quotes[Math.floor(Math.random() * quotes.length - 1) + 0]
}

function printQuote(quoteAuthor, quote) {
  document.getElementById("quote").innerHTML = quote
  document.getElementById("author").innerHTML = quoteAuthor
}

function deathCountdown() {
	const deathDate = moment('2075-03-28')
	const today = moment()
	const days = deathDate.diff(today, 'days').toLocaleString('en')
	document.getElementById('deathCountdown').innerHTML =
		'You have '.toUpperCase() + days + ' days remaining.'.toUpperCase()
	document.getElementById('title').innerHTML = days + ' Days Left'
}
