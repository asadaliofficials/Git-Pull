// Select the form, input field, suggestion container, and suggestion list elements
let form = document.getElementsByTagName('form');
let input = document.querySelector('#username');
let suggestionContainer = document.querySelector('.suggestionContainer');
let suggestionUL = document.querySelector('.suggestionContainer ul');

// Show the suggestion container when the input field gains focus and has content
input.addEventListener('focus', () => {
	if (input.value.trim().length > 0) {
		suggestionContainer.style.display = 'block';
	}
});

// Hide the suggestion container when the input field loses focus, with a slight delay
input.addEventListener('blur', () => {
	setTimeout(() => {
		suggestionContainer.style.display = 'none';
	}, 150);
});

let searchDebounce; // Variable to store the debounce timer

// Handle input events for the username field
input.addEventListener('input', () => {
	// Hide the suggestion container if the input is empty
	if (input.value.trim().length < 1) {
		suggestionContainer.style.display = 'none';
		suggestionUL.innerHTML = ' fetching data, please wait...';
	} else {
		suggestionContainer.style.display = 'block';
	}
	clearTimeout(searchDebounce); // Clear the previous debounce timer
	if (input.value.trim().length > 0) {
		// Debounce the search request to avoid excessive API calls
		searchDebounce = setTimeout(async () => {
			let limit = checkLimits('search'); // Check API rate limits
			if (limit) {
				suggestionUL.innerHTML = ' fetching data, please wait...';
				let searchData = await getSearchResult(input.value.trim());
				setSearchData(searchData.items); // Populate suggestions
			} else {
				suggestionUL.innerHTML = 'limit exceeded, try again after 1 minute!';
			}
		}, 1500);
	}
});

// Handle click events on the suggestion list
suggestionUL.addEventListener('click', e => {
	let li = e.target.closest('li'); // Find the closest <li> element
	if (li) {
		let userName = li.querySelector('h3').textContent; // Extract the username
		input.value = userName; // Set the input value to the selected username
	}
});

// Check API rate limits for either 'rate' or 'search' endpoints
async function checkLimits(p) {
	try {
		let raw = await fetch('https://api.github.com/rate_limit');
		let data = await raw.json();
		if (p == 'rate') {
			return data.rate.remaining > 1;
		} else {
			return data.resources.search.remaining > 0;
		}
	} catch (error) {
		console.error('Error fetching rate limits:', error);
		return false; // Return false if the API call fails
	}
}

let searchedData = {}; // Cache for storing previously searched data

// Fetch search results from the GitHub API
async function getSearchResult(query) {
	if (query in searchedData) {
		return searchedData[query]; // Return cached data if available
	} else {
		let raw = await fetch(`https://api.github.com/search/users?q=${query}&per_page=5`);
		let data = await raw.json();
		searchedData[query] = data; // Cache the fetched data
		return data;
	}
}

// Populate the suggestion list with search results
function setSearchData(arr) {
	if (!arr || arr.length === 0) {
		suggestionUL.innerHTML = 'No results found.';
		return;
	}
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
	suggestionUL.innerHTML = clutter; // Update the suggestion list
}

// Handle form submission to fetch and display user data
form[0].addEventListener('submit', async e => {
	e.preventDefault(); // Prevent the default form submission
	const submitButton = document.querySelector('.submit');
	submitButton.disabled = true; // Disable the button
	try {
		suggestionContainer.style.display = 'none';
		suggestionUL.innerHTML = ' fetching data, please wait...';
		const formData = new FormData(e.target);
		const username = formData.get('username');
		if (!username) return; // Exit if no username is provided
		animateButton(); // Start the button animation
		let limit = await checkLimits('rate'); // Check API rate limits
		if (limit) {
			var data = await getData(username); // Fetch user data
			var Reposdata = await getRepos(username); // Fetch user repositories
		}
		clearInterval(animator); // Stop the button animation
		animationCounter = 0;
		document.querySelector('.submit').textContent = 'Search';
		document.querySelector('#username').value = '';
		document.querySelector('#username').placeholder = 'Enter GitHub username';
		if (data.status != 404) {
			setMiddle(data.public_repos, data.followers, data.following, data.public_gists); // Update middle section
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
			setRepos(Reposdata, data.public_repos); // Update repositories section
		} else {
			document.querySelector('#username').placeholder = `${username}: not found, try another`;
		}
	} finally {
		submitButton.disabled = false; // Re-enable the button
	}
});

// Fetch user data from the GitHub API
async function getData(username) {
	try {
		let raw = await fetch(`https://api.github.com/users/${username}`);
		let data = await raw.json();
		return data;
	} catch (error) {
		console.log(error);
		return false;
	}
}

// Fetch user repositories from the GitHub API
async function getRepos(username) {
	try {
		let raw = await fetch(`https://api.github.com/users/${username}/repos?per_page=7&page=1`);
		let data = await raw.json();
		return data;
	} catch (error) {
		console.log(error);
		return false;
	}
}

// Update the middle section with user statistics
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

// Update the profile section with user details
function setProfile(available, name, login, type, date, img, bio, company, location, blog) {
	bio = bio || 'Bio not provided';
	company = company || 'Company not specified';
	location = location || 'Location not specified';
	blog = blog || 'No blog available';
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
            <img src="${img}" alt="img" />
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

// Update the repositories section with user repositories
function setRepos(arr, repos) {
	if (!arr || arr.length === 0) {
		document.querySelector('.repos ul').innerHTML = '<li>No repositories available.</li>';
		document.querySelector('.right p').textContent = `0/${repos}`;
		return;
	}
	let loopCount = 0;
	let clutter = ``;
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

let animator; // Variable to store the animation interval
let animationCounter = 0; // Counter for the animation

// Animate the search button with a loading effect
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
