const boundingBox = document.getElementById("boundingbox");
const resolutionInputWidth = document.getElementById("resolutionInputWidth");
const resolutionInputHeight = document.getElementById("resolutionInputHeight");

const compositionLengthInput = document.getElementById("compositionLengthInput");
const compOutputTextField = document.getElementById("compOutputTextField");
const buttonCopyNode = document.getElementById("buttonCopyNode");

var mousePos = {x: 0, y: 0}; // based on offsetX / offsetY
var mousePosForParticlePosition = {x: 0, y: 0}; // based on layerX / layerY
var screenResolution = {x: 640, y: 360}

var isInDrawingLoop = false;
var trackedPositions = [];


// Mouse / Touch controls for drawing

function onMouseDown(e){
    isInDrawingLoop = true;
    boundingBox.style.outlineColor = "#22b518ff";
    e.preventDefault(); // disable selecting text with the mouse held down
    trackedPositions = []; // reset previous tracked position
}
boundingBox.addEventListener("mousedown", onMouseDown);
boundingBox.addEventListener("ontouchstart", onMouseDown);


function onMouseUp(){
    isInDrawingLoop = false;
    boundingBox.style.outlineColor = "#050571";
    // failsafe: copies trackedPositions to new array
    // for the case that user clicks back in to the bounding box too fast
    updateDavinciNode(trackedPositions.slice());
}
boundingBox.addEventListener("mouseup", onMouseUp);
boundingBox.addEventListener("ontouchend", onMouseUp);
boundingBox.addEventListener("ontouchcancel", onMouseUp);

function onMouseMove(e){
    mousePos.x = e.offsetX;
    mousePos.y = e.offsetY;

    mousePosForParticlePosition.x = e.layerX;
    mousePosForParticlePosition.y = e.layerY;
}
boundingBox.addEventListener("mousemove", onMouseMove);
boundingBox.addEventListener("ontouchmove", onMouseMove);


// Updating positions and drawing particles during drawing

function drawParticle(x, y){
    const particle = document.createElement("div");
    particle.className = "drawingParticle";

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
        drawParticle(mousePosForParticlePosition.x, mousePosForParticlePosition.y);
        trackedPositions.push({x: mousePos.x, y: mousePos.y})
    }
}, 50)


function updateScreenResolution(){
    const w = Math.max(resolutionInputWidth.value, 1);
    const h = Math.max(resolutionInputHeight.value, 1);
    const newHeight = screenResolution.x * (h / w);
    
    screenResolution.y = newHeight;
    document.documentElement.style.setProperty("--bounding-box-height", newHeight+"px");
}
resolutionInputWidth.addEventListener("change", updateScreenResolution);
resolutionInputHeight.addEventListener("change", updateScreenResolution);


// Display output

function updateDavinciNode(positions){
    const compositionLength = Math.max(compositionLengthInput.value, 1);

    var linesPolyline = [];
    var linesKeyframes = [];
    
    positions.forEach((p, i) => {
        // normalize points by bounding box coords (= screen resolution) + calculate deviation from (0.5, 0.5) for Polyline
        const normalizedX = (p.x / screenResolution.x) - 0.5
        const normalizedY = (1-(p.y / screenResolution.y)) - 0.5 // 1-y, because js reports 1-to-0 and dvr expects 0-to-1
        linesPolyline.push(`{ Linear = true, LockY = true, X = ${normalizedX}, Y = ${normalizedY} }`)

        // calculate progress (0-1) for KeyFrames
        const progressOfKeyframe = i / (positions.length - 1); // between 0 and 1
        const indexOfKeyframe = Math.floor(progressOfKeyframe * compositionLength) // between 0 and compositionLength
        linesKeyframes.push(`[${indexOfKeyframe}] = { ${progressOfKeyframe}, Flags = { LockedY = true } }`)
    })
    
    const dvrNodeString = makeDVRNodeString(linesPolyline, linesKeyframes);

    compOutputTextField.value = dvrNodeString;
}

function makeDVRNodeString(linesPolyline, linesKeyframes){
    // put everything together to a dvr node string
    var dvrNodeString = [`{
	Tools = ordered() {
		Transform1 = Transform {
			CtrlWZoom = false,
			Inputs = {
				Center = Input {
					SourceOp = "Path1",
					Source = "Position",
				}
			}
		},
		Path1 = PolyPath {
			DrawMode = "InsertAndModify",
			CtrlWZoom = false,
			Inputs = {
				Displacement = Input {
					SourceOp = "Path1Displacement",
					Source = "Value",
				},
				PolyLine = Input {
					Value = Polyline {
						Points = {
							`];

    dvrNodeString.push(linesPolyline.join(`,
							`));

    dvrNodeString.push(`
						}
					},
				}
			},
		},
		Path1Displacement = BezierSpline {
			CtrlWZoom = false,
			NameSet = true,
			KeyFrames = {
				`);

    dvrNodeString.push(linesKeyframes.join(`,
				`));

    dvrNodeString.push(`
			}
		}
	},
	ActiveTool = "Transform1"
}`);

    return dvrNodeString.join("");
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

compOutputTextField.addEventListener("click", (e)=>{
    e.preventDefault()
    compOutputTextField.select();
})
