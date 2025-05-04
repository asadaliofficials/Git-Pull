let form = document.getElementsByTagName('form');
let input = document.querySelector('#username');
let suggestionContainer = document.querySelector('.suggestionContainer');
let suggestionUL = document.querySelector('.suggestionContainer ul');

input.addEventListener('focus', () => {
	if (input.value.trim().length > 0) {
		suggestionContainer.style.display = 'block';
	}
});
input.addEventListener('blur', () => {
	setTimeout(() => {
		suggestionContainer.style.display = 'none';
	}, 150);
});

let searchDebounce;
input.addEventListener('input', () => {
	if (input.value.trim().length < 1) {
		suggestionContainer.style.display = 'none';
		suggestionUL.innerHTML = ' fetching data, please wait...';
	} else {
		suggestionContainer.style.display = 'block';
	}
	clearTimeout(searchDebounce);
	if (input.value.trim().length > 0) {
		searchDebounce = setTimeout(async () => {
			let limit = checkLimits('search');
			if (limit) {
				suggestionUL.innerHTML = ' fetching data, please wait...';
				let searchData = await getSearchResult(input.value.trim());
				setSearchData(searchData.items);
			} else {
				suggestionUL.innerHTML = 'limit exceeded, try again after 1 minute!';
			}
		}, 1500);
	}
});
suggestionUL.addEventListener('click', e => {
	let li = e.target.closest('li');
	if (li) {
		let userName = li.querySelector('h3').textContent;
		input.value = userName;
	}
});

async function checkLimits(p) {
	let raw = await fetch('https://api.github.com/rate_limit');
	let data = await raw.json();
	if (p == 'rate') {
		if (data.rate.remaining > 1) return true;
		else return false;
	} else {
		if (data.resources.search.remaining > 0) return true;
		else return false;
	}
}
let searchedData = {};
async function getSearchResult(query) {
	if (query in searchedData) {
		console.log('data found in cache...');
		return searchedData[query];
	} else {
		console.log('api called for user search');

		let raw = await fetch(`https://api.github.com/search/users?q=${query}&per_page=5`);
		let data = await raw.json();
		searchedData[query] = data;
		return data;
	}
}
function setSearchData(arr) {
	console.log(arr);
	let clutter = '';
	arr.forEach(element => {
		let temp = `
				<li>
									<img src="${element.avatar_url}" alt="img" />
									<div class="text">
										<h3>${element.login}</h3>
										<p>${element.type}</p>
									</div>
								</li>
		`;
		clutter += temp;
	});
	suggestionUL.innerHTML = clutter;
}
form[0].addEventListener('submit', async e => {
	e.preventDefault();
	suggestionContainer.style.display = 'none';
	suggestionUL.innerHTML = ' fetching data, please wait...';
	const formData = new FormData(e.target);
	const username = formData.get('username');
	if (!username) return;
	animateButton();
	let limit = await checkLimits('rate');
	if (limit) {
		var data = await getData(username);
		var Reposdata = await getRepos(username);
	}
	clearInterval(animator);
	animationCounter = 0;
	document.querySelector('.submit').textContent = 'Search';
	document.querySelector('#username').value = '';
	document.querySelector('#username').placeholder = 'Enter GitHub username';
	if (data.status != 404) {
		setMiddle(data.public_repos, data.followers, data.following, data.public_gists);
		const givenDate = new Date(data.created_at); // Convert to Date object

		// Format the date to "24, Feb 2024"
		const options = {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		};

		const formattedDate = givenDate.toLocaleDateString('en-GB', options).replace(',', '');
		setProfile(
			data.hireable,
			data.name,
			data.login,
			data.type,
			formattedDate,
			data.avatar_url,
			data.bio,
			data.company,
			data.location,
			data.blog
		);
		setRepos(Reposdata, data.public_repos);
	} else {
		document.querySelector('#username').placeholder = `${username}: not found, try another`;
	}
});

async function getData(username) {
	try {
		let raw = await fetch(`https://api.github.com/users/${username}`);
		let data = await raw.json();
		return data;
	} catch (error) {
		console.log('nooooooooooooooo');
		console.log(error);

		return false;
	}
}
async function getRepos(username) {
	try {
		let raw = await fetch(`https://api.github.com/users/${username}/repos?per_page=7&page=1`);
		let data = await raw.json();
		return data;
	} catch (error) {
		console.log('nooooooooooooooo');
		console.log(error);
		return false;
	}
}

function setMiddle(repos, followers, following, gists) {
	let clutter = `
		<div class="card">
					<div class="icon">
						<box-icon type="solid" color="#a72863" name="book-content" size="md"></box-icon>
					</div>
					<div class="text">
						<h1>${repos}</h1>
						<h3>Public Repos</h3>
					</div>
				</div>
				<div class="card">
					<div class="icon icon2">
						<box-icon type="solid" color="green" name="group" size="md"></box-icon>
					</div>
					<div class="text">
						<h1>${followers}</h1>
						<h3>Followers</h3>
					</div>
				</div>
				<div class="card">
					<div class="icon icon3">
						<box-icon type="solid" color="#5748b6" name="user-plus" size="md"></box-icon>
					</div>
					<div class="text">
						<h1>${following}</h1>
						<h3>Following</h3>
					</div>
				</div>
				<div class="card">
					<div class="icon icon4">
						<box-icon color="orangered" name="code-alt" size="md"></box-icon>
					</div>
					<div class="text">
						<h1>${gists}</h1>
						<h3>Git Snippets</h3>
					</div>
				</div>
	`;
	document.querySelector('.middle').innerHTML = clutter;
}

function setProfile(available, name, login, type, date, img, bio, company, location, blog) {
	let clutter = `
		<p class="${available ? 'available' : 'notAvailable'}">${
		available ? 'available' : 'not available'
	}</p>
					<div class="header">
						<div class="text">
							<h1>${name}</h1>
							<a href="#">@${login}</a>
							<h3>● ${type}</h3>
							<h4>Account Created: ${date}</h4>
						</div>
						<img
							src="${img}"
							alt="img"
						/>
					</div>
					<p class="bio">
						${bio || 'bio has not added'}
					</p>
					<ul>
						<li>
							<box-icon size="sm" type="solid" name="buildings"></box-icon>
							<strong>${company || 'company'}</strong>
						</li>
						<li>
							<box-icon size="sm" type="solid" name="map"></box-icon>
							<strong>${location || 'location'}</strong>
						</li>
						<li>
							<box-icon size="sm" name="link"></box-icon>
							<a href="${blog || '#'}">${blog || '<i>blog not added</i>'}</a>
						</li>
					</ul>
	`;
	document.querySelector('.left').innerHTML = clutter;
}
function setRepos(arr, repos) {
	let loopCount = 0;
	let clutter = `
	`;
	for (let i = 0; i < arr.length && i < 7; i++) {
		loopCount++;
		let temp = `
					<li>
								<a target='blank' href="${arr[i].html_url}">${arr[i].name}</a>
							</li>
		`;
		clutter += temp;
	}
	document.querySelector('.repos ul').innerHTML = clutter;
	document.querySelector('.right p').textContent = `${loopCount}/${repos}`;
}
let animator;
let animationCounter = 0;
function animateButton() {
	animator = setInterval(() => {
		if (animationCounter >= 3) {
			document.querySelector('.submit').textContent = 'Search';
			animationCounter = 0;
		} else {
			animationCounter++;
			document.querySelector('.submit').textContent += '.';
		}
	}, 250);
}
