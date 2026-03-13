const API_KEY = "c2f77154";
const API_BASE = "https://www.omdbapi.com/";

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const movieGrid = document.getElementById("movieGrid");
const loadingSpinner = document.getElementById("loadingSpinner");
const noResults = document.getElementById("noResults");

/* Modal Elements */

const movieModal = document.getElementById("movieModal");
const modalPoster = document.getElementById("modalPoster");
const modalTitle = document.getElementById("modalTitle");
const modalYear = document.getElementById("modalYear");
const modalPlot = document.getElementById("modalPlot");
const modalRating = document.getElementById("modalRating");
const closeModal = document.getElementById("closeModal");

/* Search events */

searchBtn.addEventListener("click", handleSearch);

searchInput.addEventListener("keypress", (event)=>{
if(event.key === "Enter"){
handleSearch();
}
});

function handleSearch(){
const query = searchInput.value.trim() || "movie";
searchMovies(query);
}

/* Fetch Movies */

async function searchMovies(query){

loadingSpinner.classList.remove("hidden");
noResults.classList.add("hidden");
movieGrid.innerHTML = "";

try{

const res = await fetch(
`${API_BASE}?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=movie&page=1`
);

const data = await res.json();

if(data.Response === "True" && data.Search.length > 0){

data.Search.forEach((movie)=>{
movieGrid.appendChild(createMovieCard(movie));
});

}else{
noResults.classList.remove("hidden");
}

}catch(err){

noResults.classList.remove("hidden");

}finally{

loadingSpinner.classList.add("hidden");

}

}

/* Create Movie Card */

function createMovieCard(movie){

const card = document.createElement("div");

card.className =
"movie-card bg-gray-800 rounded-lg overflow-hidden animate-fade-in cursor-pointer";

const poster =
movie.Poster !== "N/A"
? movie.Poster
: "https://via.placeholder.com/300x450?text=No+Image";

card.innerHTML = `
<div class="h-64 overflow-hidden">
<img src="${poster}" alt="${movie.Title}" class="poster-img" loading="lazy"/>
</div>

<div class="p-4">
<h3 class="font-bold text-base mb-1 line-clamp-2">${movie.Title}</h3>
<p class="text-gray-400 text-sm">${movie.Year}</p>
</div>
`;

card.addEventListener("click", ()=>{
showMovieDetails(movie.imdbID);
});

return card;

}

/* Fetch Movie Details */

async function showMovieDetails(imdbID){

try{

const res = await fetch(
`${API_BASE}?apikey=${API_KEY}&i=${imdbID}&plot=short`
);

const movie = await res.json();

const poster =
movie.Poster !== "N/A"
? movie.Poster
: "https://via.placeholder.com/300x450?text=No+Image";

modalPoster.src = poster;
modalTitle.textContent = movie.Title;
modalYear.textContent = movie.Year;

modalRating.textContent = `⭐ IMDb Rating: ${movie.imdbRating}`;

modalPlot.textContent = movie.Plot;

movieModal.classList.remove("hidden");
movieModal.classList.add("flex");

}catch(err){
console.error(err);
}

}

/* Close Modal */

closeModal.addEventListener("click", ()=>{
movieModal.classList.add("hidden");
movieModal.classList.remove("flex");
});

movieModal.addEventListener("click",(e)=>{
if(e.target === movieModal){
movieModal.classList.add("hidden");
movieModal.classList.remove("flex");
}
});

/* Default Movies */

searchMovies("movie");