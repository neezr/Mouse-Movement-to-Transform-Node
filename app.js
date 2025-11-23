const boundingBox = document.getElementById("boundingbox");
const resolutionInputWidth = document.getElementById("resolutionInputWidth");
const resolutionInputHeight = document.getElementById("resolutionInputHeight");

const compositionLengthInput = document.getElementById("compositionLengthInput");
const compOutputTextField = document.getElementById("compOutputTextField");
const buttonCopyNode = document.getElementById("buttonCopyNode");

var mousePos = {x: 0, y: 0};
const BOUNDING_BOX_WIDTH = 640;

var isInDrawingLoop = false;
var trackedPositions = [];


// TODO add touch controls

boundingBox.addEventListener("mousedown", (e) => {
    isInDrawingLoop = true;
    boundingBox.style.outlineColor = "#22b518ff";
    e.preventDefault(); // disable selecting text with the mouse held down
    trackedPositions = []; // reset previous tracked position
})

boundingBox.addEventListener("mouseup", () => {
    isInDrawingLoop = false;
    boundingBox.style.outlineColor = "#050571";
    console.log(trackedPositions);
    // failsafe: copies trackedPositions to new array
    // for the case that user clicks back in to the bounding box too fast
    updateDavinciNode(trackedPositions.slice());
})

boundingBox.addEventListener("mousemove", (e)=>{
    mousePos.x = e.x;
    mousePos.y = e.y;
})


function drawParticle(x, y){
    const particle = document.createElement("div");
    particle.className = "drawingParticle";

    // console.log("draw particle at", x, y)

    particle.style.left = x+"px";
    particle.style.top = y+"px";

    particle.addEventListener("animationend", ()=>{
        particle.remove();
    })

    // x and y from mousePos will never be outside of the boundingbox
    // so appending to the document is fine
    document.body.appendChild(particle);
}

// get mouse position every 50ms
setInterval(() => {
    if (isInDrawingLoop){
        // console.log("drawing...")
        // console.log(mousePos)
        drawParticle(mousePos.x, mousePos.y);
        trackedPositions.push({x: mousePos.x, y: mousePos.y})
    }
}, 50)


function updateScreenResolution(){
    const w = Math.max(resolutionInputWidth.value, 1);
    const h = Math.max(resolutionInputHeight.value, 1);
    const newHeight = BOUNDING_BOX_WIDTH * (h / w);
    
    document.documentElement.style.setProperty("--bounding-box-height", newHeight+"px");
}
resolutionInputWidth.addEventListener("change", updateScreenResolution);
resolutionInputHeight.addEventListener("change", updateScreenResolution);

function prunePositions(positions){
    // not in place
    // TODO remove duplicates / or remove with sensitivity
    return positions;
}

function updateDavinciNode(positions){
    const dvrCompWidth = Math.max(resolutionInputWidth.value, 1);
    const dvrCompHeight = Math.max(resolutionInputHeight.value, 1);
    const compositionLength = Math.max(compositionLengthInput.value, 1);

    positions = prunePositions(positions);

    // TODO normalize points by bounding box coords (= screen resolution = values from resolutionInputs)
    // TODO calculate progress (0-1) for KeyFrames, calculate deviation to (0.5, 0.5) for Polyline
    for (const p of positions){
        p.x
        p.y
    }
    console.log(dvrCompWidth, dvrCompHeight, compositionLength)
}

compositionLengthInput.addEventListener("change", ()=>{
    updateDavinciNode(trackedPositions);
})

buttonCopyNode.addEventListener("click", ()=>{
    navigator.clipboard.writeText(compOutputTextField.value);
    
    buttonCopyNode.textContent = "Copied!";
    setTimeout(()=>{
        buttonCopyNode.textContent = "Copy Transform Node to Clipboard";
    }, 1000);
})

