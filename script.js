"use strict";


// Selection part,
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

// any global variable in any script will be available in all scripts. TIP!!

// parent class for all type of workouts.
class Workourt {
  date = new Date();
  id = (Date.now() + "").slice(-10); //manual id, but usually we use a library for it.
  clicks = 0;

  constructor(coords, distance, duration) {
    // this.date = ...
    // this.id = ...
    this.coords = coords; // [lat, lng]
    this.distance = distance; //in km
    this.duration = duration; //in min
  }

  _setDescription(){
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
    'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on 
    ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }

  click(){
    this.clicks++;
  }
}

class Running extends Workourt {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  
  calcPace() {
    //pace = min/km
    
    // declaring a new property (pace)
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workourt {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.clacSpeed();
    this._setDescription();
  }

  clacSpeed() {
    //  km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}


// Main class of the program
class App {
  ////// private property //////

  // it is used to storing the actual map
  #map; 

  #mapEvent;
  #workout = [];

  // it set the zoom value of the map at its initial time
  #mapZoomLevel = 14;

  ////// end of the property field /////


  constructor() {
    // Get user Position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage()

    // pressing enter key on keyboard
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);

    // Event Delegation
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  // gets the location of the user
  _getPosition() {
    if (navigator.geolocation)
      // first callback success, second one is error
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),

        function () {
          alert("Could not get your position");
        }
      );
  }

  // create a map using leaflet lib based on user's locations.
  _loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    const coords = [latitude, longitude];

    // L is nameSpace of leaflet library
    // it was added to the app in html file
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on("click", this._showForm.bind(this));

    // map exists here,
    // if there was any workout in the localStorage, this code will shows it to the map
    this.#workout.forEach(work =>{
      this._renderWorkoutMarker(work);
    });
  }

  _hideForm(){
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";

    form.style.display = 'none';
    form.classList.add("hidden");
    setTimeout(() =>{
      form.style.display = 'grid';
    }, 1000)
  }

  // this method shows the form to the user
  _showForm(mapE) {
    // mapE is the details of the click event 
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  // it appear and disppear the proper input for the choosen type.
  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  // this function make a new wrokout based on user inputs.
  _newWorkout(e) {
    // these two functionsl checking the conditions of input first.
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get the data from the form
    const type = inputType.value;
    const distance = +inputDistance.value; //convert to number
    const duration = +inputDuration.value; //convert to number
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running, create running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Inputs have to be positive numbers!"); //gaurd caluse

        workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cyccling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("Inputs have to be positive numbers!"); //gaurd caluse
        workout = new Cycling([lat, lng], distance, duration, elevation);
      }

    // Add new object to workout array
    this.#workout.push(workout);


    // Render workout on map as marker
    // display marker
    // in here this is the class itself.
    this._renderWorkoutMarker(workout)

    // Render workout on list
      this._renderWorkout(workout);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  // this function makes new popUp in the map based on workout data.
  _renderWorkoutMarker(workout){
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          // this className is declared in CSS file
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
      .openPopup();
  }

  // this method manipulate the DOM, and disply workout in the UI
  _renderWorkout(workout){
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
    </div>
    `
    if(workout.type === 'running')
      html +=`
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
        </li>
      `;

    if(workout.type === 'cycling')
      html += `
      </div>
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    // this code adds the builded html content to the DOM. 
    form.insertAdjacentHTML('afterend', html); // after form element in document.!!
  }



  // this important func set the map location to selected workout which was clicked.
  _moveToPopup(e){
    // Event Delegation
    const workoutEl = e.target.closest('.workout');

    if(!workoutEl) return;

    const workout = this.#workout.find(work => work.id === workoutEl.dataset.id);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1.5,
      },
    });

    // using the public inteface
    // out of chain of prototype
    // workout.click();
  }

  // add all workout to the localStorage as JASON.
  _setLocalStorage(){
    // browser api //
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }

  // this method get all stored data in localStorage!
  _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem('workouts'));

    if(!data) return;

    this.#workout = data;
    this.#workout.forEach(work =>{
      this._renderWorkout(work);

      // map doesn't exist here,
      // this._renderWorkoutMarker(work);
    });
  }

  reset(){
    localStorage.removeItem('workouts');
    // a big object in js
    location.reload();
  }
}

const app = new App();
