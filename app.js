//Global Selections and Variables
const colorDivs = document.querySelectorAll(".color");
const generateBtn = document.querySelector(".generate");
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexes = document.querySelectorAll(".color h2");
const popup = document.querySelector(".copy-container");
const adjustButton = document.querySelectorAll(".adjust");
const lockButton = document.querySelectorAll(".lock");
const closeAdjustments = document.querySelectorAll(".close-adjustment")
const sliderContainers = document.querySelectorAll(".sliders");
let initialColors;
let savedPalettes = [];


//Event Listeners
generateBtn.addEventListener("click", randomColors);
sliders.forEach((slider) => {
    slider.addEventListener("input", hslControls);
});
colorDivs.forEach((div, index)=>{
    div.addEventListener("change", ()=>{
        updateTextUI(index);
    });
});
currentHexes.forEach(hex =>{
    hex.addEventListener("click", ()=>{
        copyToClipboard(hex);
    });
});
popup.addEventListener("transitionend", ()=>{
    const popupBox = popup.children[0];
    popup.classList.remove("active");
    popupBox.classList.remove("active");
});
adjustButton.forEach((button, index) => {
    button.addEventListener("click", () => {
      openAdjustmentPanel(index);
    });
  });
closeAdjustments.forEach((button, index) => {
    button.addEventListener("click", () => {
      closeAdjustmentPanel(index);
    });
  });
  lockButton.forEach((button, index) => {
    button.addEventListener("click", (e) => {
      lockLayer(e, index);
    });
  });

//Functions

//----**Color Generator Using ChromaJs**---
function generateHex() {
    const hexColor = chroma.random();
    return hexColor;
}

//----**Looping over our clorDivs and adding the color**----
function randomColors(){
    initialColors = [];
    colorDivs.forEach((div, index)=>{
        const hexText = div.children[0];
        const randomColor = generateHex();
        //Add the random color to initialColors array in hex foramt
        //And preserving the value of locked class
        if (div.classList.contains("locked")) {
          initialColors.push(hexText.innerText);
          return;
        }else {
          initialColors.push(chroma(randomColor).hex());
        }
        // Add Color to the background
        div.style.background = randomColor;
        hexText.innerText = randomColor;
        //Envoking checkContrast function
        checkTextContrast(randomColor, hexText);
        //Initial Colorize Slider
        const color = chroma(randomColor);
        const sliders = div.querySelectorAll(".sliders input");
        const hue = sliders[0];
        const brightness = sliders[1];
        const saturation = sliders[2];

        //Envoking colorizeSlider function
        colorizeSliders(color, hue, brightness, saturation);
    });
    //Envoking our resetInputs function
    resetInputs();
    //Checking for the contrast
    adjustButton.forEach((button,index)=> {
      checkTextContrast(initialColors[index], button);
      checkTextContrast(initialColors[index], lockButton[index]);  
    });
}

//----**Contrast Function using ChromaJS**----
function checkTextContrast(color, text){
    const luminance = chroma(color).luminance();
    if (luminance >0.5){
        text.style.color = "black";
    } else {
        text.style.color ="white";
    }
}

//----**Colorizing the sliders using ChromaJS**----
function colorizeSliders(color, hue, brightness, saturation) {
    //Scale Saturation
    const noSat = color.set("hsl.s", 0);
    const fullSat = color.set("hsl.s", 1);
    const scaleSat = chroma.scale([noSat, color, fullSat]);
    //Update Saturation Background
    saturation.style.backgroundImage = `linear-gradient(to right,${scaleSat(0)}, ${scaleSat(1)}`;
    //Scale Brightness
    const midBright = color.set ("hsl.l", 0.5);
    const scaleBright = chroma.scale(["black", midBright, "white"]);
    //Updating Brightness Background
    brightness.style.backgroundImage = `linear-gradient(to right,${scaleBright(0)}, ${scaleBright(0.5)}, ${scaleBright(1)}`;
    //Updating hue background
    hue.style.backgroundImage = `linear-gradient(to right, rgb(204,75,75),rgb(204,204,75),rgb(75,204,75),rgb(75,204,204),rgb(75,75,204),rgb(204,75,204),rgb(204,75,75))`;
}
//----**Chaning our background color when sliding our inputs**----
function hslControls(e) {
    //Getting the index of our color divs which we set in html
    const index =
      e.target.getAttribute("data-bright") ||
      e.target.getAttribute("data-sat") ||
      e.target.getAttribute("data-hue");
  
    //Selecting our sliders and assigning them to variables
    let sliders = e.target.parentElement.querySelectorAll('input[type="range"]');
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    //Getting the color which we have set
    //We are using the array here as we want to refer to our original color when we change our saturation or brightness
    const bgColor = initialColors[index];
    
    //Setting new values of saturation, brightness and hue
    let color = chroma(bgColor)
      .set("hsl.s", saturation.value)
      .set("hsl.l", brightness.value)
      .set("hsl.h", hue.value);

      //Haven't understood : We change our color when hue changes so we are affecting the brig/sat of new color when we are
      //Taking reference of the first color before changing hue???
      //Answer :Got it. Apparently hue is present in every color. It itself is not the color. We were actually chaning the hue of our orginial color 
    colorDivs[index].style.backgroundColor = color;

    //Updating Sliders/Input color
    colorizeSliders(color,hue,brightness,saturation);
}
//----**Updating our hex text and checking its contrast after chaning color and **----
function updateTextUI(index) {
    const activeDiv = colorDivs[index];
    const color = chroma(activeDiv.style.backgroundColor);
    const textHex = activeDiv.querySelector("h2");
    const icons = activeDiv.querySelectorAll(".controls button");
    textHex.innerText = color.hex();
    //Check Contrast
    checkTextContrast(color, textHex);
    for (icon of icons) {
        checkTextContrast(color, icon); 
    }
}
//----**Resetting our sliders to the appropriate position as per the background color**----
function resetInputs() {
    const sliders = document.querySelectorAll(".sliders input");
    sliders.forEach((slider) => {
      if (slider.name === "hue") {
        //[slider.getAttribute("data-hue")] returns the colordiv which the hue color belongs
        const hueColor = initialColors[slider.getAttribute("data-hue")];
        const hueValue = chroma(hueColor).hsl()[0];
        slider.value = Math.floor(hueValue);
      }
      if (slider.name === "sat") {
        const satColor = initialColors[slider.getAttribute("data-sat")];
        const satValue = chroma(satColor).hsl()[1];
        slider.value = Math.floor(satValue*100)/100;
      }
      if (slider.name === "brightness") {
        const brightColor = initialColors[slider.getAttribute("data-bright")];
        const brightValue = chroma(brightColor).hsl()[2];
        slider.value = Math.floor(brightValue*100)/100;
      }
    });
}
//----**Copy to Clipboard Function**----
function copyToClipboard(hex){
    //Creating Textarea(an element). So that we can use its copy method
    const el = document.createElement("textarea");
    el.value = hex.innerText;
    document.body.appendChild(el);
    //Text area method
    el.select();
    document.execCommand("copy");
    //Removing the text area after our job is done
    document.body.removeChild(el);

    //Popup animation
    const popupBox = popup.children[0];
    //Adding active to our pop-up conatiner and pop-up box
    popup.classList.add("active");
    popupBox.classList.add("active");
}
//----**Toggling active class to our adjustment panel**----
function openAdjustmentPanel(index) {
    sliderContainers[index].classList.toggle("active");
}
//----**Removing active class from our adjustment panel when closing it**----
function closeAdjustmentPanel(index) {
    sliderContainers[index].classList.remove("active");
}
//----**Lock Layer Function**----
function lockLayer(e, index) {
  const lockSVG = e.target.children[0];
  const activeBg = colorDivs[index];
  //Adding locked class
  activeBg.classList.toggle("locked");
  //Chaning lock icon
  if (lockSVG.classList.contains("fa-lock-open")) {
    e.target.innerHTML = '<i class="fas fa-lock"></i>';
  } else {
    e.target.innerHTML = '<i class="fas fa-lock-open"></i>';
  }
}


randomColors();