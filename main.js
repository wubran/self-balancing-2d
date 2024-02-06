canvascolor = "rgba(19, 23, 26, 1)";
var canvas = document.getElementById('screen');
var ctx = canvas.getContext('2d');

items = []

var click = false
var mouseX = canvas.width/2;
var mouseY = 0;
var pause = false;

let hH = 3*canvas.height/4;

function fillscreen(){
    ctx.fillStyle = canvascolor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 245, 80, 1)";
    ctx.font = canvas.width / 30 + "px Arial";
    if(pause){
        ctx.fillText("paused", 35*canvas.width/40, 19*canvas.height/20);
    }

    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0,hH);
    ctx.lineTo(canvas.width,hH);
    ctx.moveTo(canvas.width/2,hH);
    ctx.lineTo(canvas.width/2,canvas.height);
    ctx.stroke();
}

// the WHEEL
let torW = 0;
let forW = 0;
let wheelTheta = 0;
let vheelTheta = 0;
let vW = 0;
let xW = canvas.width/2;
const r = 50;
let motorT = 0;
let wheelMass = 0.050;
const wheelI = 0.0005;

// the BAR
let torB = 0;
let forB = 0;
let theta = Math.PI/2 + 1*(Math.random()-0.5); // relative to the FLOOR
let vtheta = 0;
const l = 300; // mm
const barI = 0.002; // rotational inertia
const barMass = 0.200; //kg
const distCM = 200; // mm

let targetX = xW;

function vectorAng(x, y, l, ang, color){
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - l*Math.cos(ang), y - l*Math.sin(ang));
    ctx.stroke();
}

function vectorComp(x, y, vx, vy, color){
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x + vx, y + vy);
    ctx.stroke();
}

function wheelArc(rOffset, thota, color, width = 1){
    ctx.lineWidth = width;
    ctx.strokeStyle = color
    ctx.beginPath();
    if(thota<0){
        ctx.arc(xW, hH-r,r+rOffset,theta + Math.PI + thota,theta + Math.PI);
    }else{
        ctx.arc(xW, hH-r,r+rOffset,theta + Math.PI,theta + Math.PI + thota);
    }
    ctx.stroke();
}

function drawThing(){
    // draw wheel
    ctx.lineWidth = 1;
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.arc(xW,hH-r,r,0,2*Math.PI);
    ctx.stroke();
    // draw wheel nib
    ctx.fillStyle = "white";
    for(let i = 0; i<8; i++){
        ctx.beginPath();
        ctx.arc(xW - r*Math.cos(wheelTheta+i*Math.PI/4), hH-r - r*Math.sin(wheelTheta+i*Math.PI/4),2,0,2*Math.PI);
        ctx.fill();
    }
    // draw cm
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(xW - distCM*Math.cos(theta), hH-r - distCM*Math.sin(theta),3,0,2*Math.PI);
    ctx.fill();
    // draw stick
    ctx.beginPath();
    ctx.moveTo(xW,hH-r);
    ctx.lineTo(xW - l*Math.cos(theta), hH-r - l*Math.sin(theta));
    ctx.stroke();

    if(click){
        ctx.strokeStyle = "yellow";
    }else{
        ctx.strokeStyle = "khaki";
    }
    ctx.beginPath();
    ctx.lineWidth = 20;
    ctx.moveTo(canvas.width/2,4*canvas.height/5);
    ctx.lineTo(mouseX, 4*canvas.height/5);
    ctx.stroke();
    ctx.lineWidth = 1;
}

let oldTime = 0;
function loop(timestamp){
    dt = (timestamp-oldTime)/10000;
    oldTime = timestamp;
    fillscreen();
    drawThing();

    let vectCMx = distCM*Math.cos(theta);
    let vectCMy = distCM*Math.sin(theta);
    let barWeight = barMass*9.81;
    let weightParallelBar = barWeight*vectCMy/distCM;
    let weightPerpBar = Math.sqrt(barWeight*barWeight - weightParallelBar*weightParallelBar);
    let CMx = xW - vectCMx;
    let CMy = hH-r - vectCMy;
    let pointAx = 0;
    let pointAy = 50*barWeight;
    let pointBx = pointAx - 50*weightParallelBar*vectCMx/distCM;
    let pointBy = pointAy - 50*weightParallelBar*vectCMy/distCM;
    vectorComp(CMx, CMy, pointAx, pointAy, "aquamarine");
    vectorComp(CMx, CMy, pointBx, pointBy, "green");
    vectorComp(CMx, CMy, pointAx - pointBx, pointAy - pointBy, "aqua");
    // vectorComp(CMx + pointBx, CMy + pointBy, pointAx - pointBx, pointAy - pointBy, "aqua");

    let barTorque = Math.sign(pointBx)*weightPerpBar*distCM/1000; // about the axle
    let barPushWheelX = (pointAx - pointBx)/50;
    // vectorComp(xW, hH-r, 50*barPushWheelX, 0, "aqua");
    if(click){
        motorT = 1.0*(mouseX - canvas.width/2)/canvas.width;
    } else{
        const tmpScale = 2;
        // lets do PD control
        motorT = 3*(theta - Math.PI/2);
        motorT += 0.04*vtheta;
        wheelArc(-25, tmpScale*(3*(theta - Math.PI/2)), "red",4)
        wheelArc(-25, tmpScale*(0.08*vtheta), "white",2.5)

        // basically offsets the target angle depending on which side of target X we're on
        // var xCorrection = Math.max(-0.5, Math.min(0.5, (xW-targetX)/1000));
        // // console.log(xCorrection)
        // var xErrorVelocity = Math.max(-0.3, Math.min(0.3, (-dt*vheelTheta*r)/20));
        // console.log(xErrorVelocity)
        // motorT += xCorrection;
        // console.log(xErrorVelocity);
        // motorT -= xErrorVelocity;

        // wheelArc(-35, tmpScale*(xCorrection), "red",4)
        // wheelArc(-35, tmpScale*(-xErrorVelocity), "white",2.5)
    }
    let wheelTorque = 0.0*barTorque + motorT + r*barPushWheelX/1000; // net torque on the wheel
    barTorque -= wheelTorque;

    wheelArc(5, barTorque, "green")
    wheelArc(-5, motorT, "pink")
    wheelArc(0, wheelTorque, "red")
    wheelArc(-10, r*barPushWheelX/1000, "aqua")

    // wheelArc(-30, vheelTheta/20, "yellow", 2)
    // wheelArc(30, vtheta/20, "yellow", 2)

    vtheta += dt*barTorque/barI; // T = I*a --> w = dt*T/I
    theta += dt*vtheta;
    if(theta > Math.PI || theta < 0){
        return;
    }

    vheelTheta += dt*wheelTorque/wheelI;
    wheelTheta += dt*vheelTheta;
    xW += dt*vheelTheta*r;

    // vW += dt*barPushWheelX/wheelMass;
    // xW += vW;

    
    requestAnimationFrame(loop)
}

requestAnimationFrame(loop);