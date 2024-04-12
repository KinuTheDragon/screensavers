const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const randint = (x, y) => Math.floor(randnum(x, y + 1));
const randnum = (x, y) => Math.random() * (y - x) + x;
const randcolor = () => [0,0,0].map(x=>randint(0,255));
const randchoice = coll => coll[randint(0, coll.length - 1)];
const percentChance = n => Math.random() * 100 <= n;
const shuffled = list => {
    let output = [];
    let indices = new Array(list.length).fill(0).map((x,i)=>i);
    while (indices.length) {
        let index = randchoice(indices);
        indices.splice(indices.indexOf(index), 1);
        output.push(list[index]);
    }
    return output;
}

const zip = (x, y) => x.map((n, i) => [n, y[i]]);
const lerp = (x, y, t) => x * (1-t) + y * t;
const deepcopy = x => JSON.parse(JSON.stringify(x));
const color2hex = c => "#" + c.map(x=>x.toString(16).padStart(2,"0")).join("");
const color2rgba = (c, a) => "rgba(" + c.join(",") + "," + a + ")";
const colorlerp = (c1,c2,t) => zip(c1,c2).map(x => Math.round(lerp(x[0],x[1],t)));

ctx.font = "50px Courier New";

const cls = (color) => {
    let oldStyle = ctx.fillStyle;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = oldStyle;
}

const fillCircle = (x, y, radius, color) => {
    let oldStyle = ctx.fillStyle;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = oldStyle;
}

const fillPoly = (points, color) => {
    let oldStyle = ctx.fillStyle;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0].x ?? points[0][0],
               points[0].y ?? points[0][1]);
    for (let point of points) {
        ctx.lineTo(point.x ?? point[0],
                   point.y ?? point[1]);
    }
    ctx.fill();
    ctx.fillStyle = oldStyle;
}

const writeCentered = (text, x, y, color) => {
    let oldStyle = ctx.fillStyle;
    ctx.fillStyle = color;
    let tm = ctx.measureText(text);
    let height = tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent;
    ctx.fillText(text, x - tm.width / 2, y + height / 2);
    ctx.fillStyle = oldStyle;
}

const SCREENSAVERS = Object.freeze([
    {
        name: "Random Circles",
        setup: (data) => {
            data.circles = [];
            for (let i = 0; i < 20; i++) {
                data.circles.push({
                    x: randnum(0, width),
                    y: randnum(0, height),
                    xvel: randnum(-3, 3),
                    yvel: randnum(-3, 3),
                    color: color2hex(randcolor())
                });
            }
        },
        update: (data) => {
            for (let circle of data.circles) {
                circle.x += circle.xvel;
                circle.y += circle.yvel;
                if (circle.x < 0 || circle.x > width) {
                    circle.xvel *= -1;
                }
                if (circle.y < 0 || circle.y > height) {
                    circle.yvel *= -1;
                }
            }
        },
        draw: (data) => {
            cls("#000");
            for (let circle of data.circles) {
                fillCircle(circle.x, circle.y, 10, circle.color);
            }
        }
    }, {
        name: "Random Graph",
        setup: (data) => {
            data.samples = new Array(100).fill(50);
            data.lowcolor = randcolor();
            data.highcolor = randcolor();
        },
        update: (data) => {
            if (time % 40 === 0) {
                data.samples.shift();
                let last = data.samples[data.samples.length - 1];
                let next = last + randnum(-10, 10);
                if (next > 100) next = 100;
                if (next < 0) next = 0;
                data.samples.push(next);
            }
        },
        draw: (data) => {
            const graphWidth = 300;
            const graphHeight = 300;
            const graphLeft = width / 2 - graphWidth / 2;
            const graphRight = graphLeft + graphWidth;
            const graphTop = height / 2 - graphHeight / 2;
            const graphBottom = graphTop + graphHeight;
            cls("#000");
            let last = data.samples[data.samples.length - 1];
            let color = color2hex(
                colorlerp(data.lowcolor, data.highcolor,
                          last / 100)
            );
            let points = [[graphLeft, graphBottom]];
            for (let i = 0; i < data.samples.length; i++) {
                let sample = data.samples[i];
                let x = lerp(graphLeft, graphRight, i / data.samples.length);
                let y = lerp(graphBottom, graphTop, sample / 100);
                points.push([x, y]);
            }
            points.push([graphRight, graphBottom]);
            fillPoly(points, color);
        }
    }, {
        name: "Double Pendulum",
        setup: (data) => {
            data.angle1 = randnum(0, 2 * Math.PI);
            data.angle2 = randnum(0, 2 * Math.PI);
            data.angle1_vel = 0;
            data.angle2_vel = 0;
            data.color1 = randcolor();
            data.color2 = randcolor();
            data.length1 = randnum(50, 150);
            data.length2 = randnum(50, 150);
            data.gravity = randnum(1, 10);
            data.mass1 = randnum(1, 10);
            data.mass2 = randnum(1, 10);
            data.afterimages = [];
            data.trail = new Path2D();
            data.trailed = false;
            data.trailing = false;
            mouseCallback = (x, y, b) => {
                if (!b) {
                    data.trail = new Path2D();
                    data.trailed = false;
                } else {
                    data.trailing = !data.trailing;
                }
            };
        },
        update: (data) => {
            if (time % 10 > 0) return;
            const g = data.gravity;
            const m1 = data.mass1;
            const m2 = data.mass2;
            const a1 = data.angle1;
            const a2 = data.angle2;
            const a1_v = data.angle1_vel;
            const a2_v = data.angle2_vel;
            const r1 = data.length1;
            const r2 = data.length2;
            const sin = Math.sin;
            const cos = Math.cos;
            
            let num1 = -g * (2 + m1 + m2) * sin(a1);
            let num2 = -m2 * g * sin(a1 - 2 * a2);
            let num3 = -2 * sin(a1 - a2) * m2;
            let num4 = a2_v * a2_v * r2 + a1_v * a1_v * r1 * cos(a1 - a2);
            let den = r1 * (2 * m1 + m2 - m2 * cos(2 * a1 - 2 * a2));
            let angle1_acc = (num1 + num2 + num3 * num4) / den;

            num1 = 2 * sin(a1 - a2);
            num2 = (a1_v * a1_v * r1 * (m1 + m2));
            num3 = g * (m1 + m2) * cos(a1);
            num4 = a2_v * a2_v * r2 * m2 * cos(a1 - a2);
            den = r2 * (2 * m1 + m2 - m2 * cos(2 * a1 - 2 * a2));
            let angle2_acc = (num1 * (num2 + num3 + num4)) / den;

            data.angle1_vel += angle1_acc;
            data.angle2_vel += angle2_acc;
            data.angle1 += data.angle1_vel;
            data.angle2 += data.angle2_vel;

            data.afterimages.push({
                angle1: data.angle1,
                angle2: data.angle2
            });
            if (data.afterimages.length > 10)
                data.afterimages.shift();
            if (!data.trailing) return;
            if (data.trailed) {
                data.trail.lineTo(
                    width / 2 +
                        data.length1 * Math.sin(data.angle1) +
                        data.length2 * Math.sin(data.angle2),
                    height / 2 +
                        data.length1 * Math.cos(data.angle1) +
                        data.length2 * Math.cos(data.angle2)
                );
            } else {
                data.trail.moveTo(
                    width / 2 +
                        data.length1 * Math.sin(data.angle1) +
                        data.length2 * Math.sin(data.angle2),
                    height / 2 +
                        data.length1 * Math.cos(data.angle1) +
                        data.length2 * Math.cos(data.angle2)
                );
                data.trailed = true;
            }
        },
        draw: (data) => {
            ctx.lineWidth = 3;
            const length1 = data.length1;
            const length2 = data.length2;
            const cx = width / 2;
            const cy = height / 2;
            cls("#000");
            for (let i = 0; i < data.afterimages.length; i++) {
                let opacity = i / data.afterimages.length;
                let angle1 = data.afterimages[i].angle1;
                let angle2 = data.afterimages[i].angle2;
                let c1 = color2rgba(data.color1, opacity);
                let c2 = color2rgba(data.color2, opacity);
                let x1 = cx + length1 * Math.sin(angle1);
                let y1 = cy + length1 * Math.cos(angle1);
                let x2 = x1 + length2 * Math.sin(angle2);
                let y2 = y1 + length2 * Math.cos(angle2);
                ctx.strokeStyle = c1;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(x1, y1);
                ctx.stroke();
                ctx.strokeStyle = c2;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                fillCircle(x1, y1, data.mass1 * 5, c1);
                fillCircle(x2, y2, data.mass2 * 5, c2);
            }
            if (!data.trailing) return;
            ctx.strokeStyle = color2hex(data.color2);
            ctx.stroke(data.trail);
        }
    }, {
        name: "Fish Tank",
        setup: (data) => {
            const numFish = randint(5, 20);
            const numBubblers = randint(1, 3);
            const numKelp = randint(1, 5);
            const maxFishSegments = 5;
            const fishSegmentSize = data.fishSegmentSize = 10;
            const kelpRadius = data.kelpRadius = 10;
            const fishXVelRange = [1, 5];
            const fishYVelRange = [1, 5];
            const fishXFlipTimeRange =
                data.fishXFlipTimeRange = [10, 60];
            const fishYFlipTimeRange =
                data.fishYFlipTimeRange = [2, 20];
            data.bubblerChance = 5;
            data.bubbleSizeRange = [1, 8];
            data.maxBubbleXMove = 3;
            data.bubbleYMoveRange = [2, 4];
            data.kelpChangeChance = 5;
            
            data.mytime = 0;
            data.segTypes = {
                cross: (x, y) => {
                    let left = x - fishSegmentSize / 2;
                    let top = y - fishSegmentSize / 2;
                    let ti = top + fishSegmentSize / 4;
                    let right = left + fishSegmentSize;
                    let bottom = top + fishSegmentSize;
                    let bi = bottom - fishSegmentSize / 4;
                    let mid = x;
                    fillPoly([
                        [left, top],
                        [mid, ti],
                        [right, top],
                        [right, bottom],
                        [mid, bi],
                        [left, bottom]
                    ], ctx.fillStyle);
                },
                square: (x, y) => {
                    ctx.fillRect(x - fishSegmentSize / 2,
                                 y - fishSegmentSize / 2,
                                 fishSegmentSize,
                                 fishSegmentSize);
                },
                semis: (x, y) => {
                    let eta = Math.PI / 2;
                    ctx.beginPath();
                    ctx.moveTo(x + fishSegmentSize / 2, 
                               y - fishSegmentSize / 2);
                    ctx.arc(x + fishSegmentSize / 2,
                            y, fishSegmentSize / 2,
                            eta, -eta, false);
                    ctx.moveTo(x - fishSegmentSize / 2, 
                               y - fishSegmentSize / 2);
                    ctx.arc(x - fishSegmentSize / 2,
                            y, fishSegmentSize / 2,
                            eta, -eta, true);
                    ctx.fill();
                }
            };
            const colorPatterns = Object.freeze({
                random: c =>
                    c.map(x => color2hex(randcolor())),
                headTail: c => {
                    let headColor = color2hex(randcolor());
                    let bodyColor = color2hex(randcolor());
                    let colors = c.fill(bodyColor);
                    colors[0] = headColor;
                    colors[colors.length - 1] = headColor;
                    return colors;
                },
                single: c => c.fill(color2hex(randcolor())),
                gradient: c => {
                    let start = randcolor();
                    let end = randcolor();
                    return c.map((x, i) =>
                        color2hex(
                            colorlerp(start, end, i / c.length)
                        )
                    );
                }
            });

            data.fish = [];
            for (let i = 0; i < numFish; i++) {
                let segments = ["head"];
                let segmentCount = randint(1, maxFishSegments);
                for (let j = 0; j < segmentCount; j++) {
                    segments.push(randchoice(
                        Object.keys(data.segTypes)
                    ));
                }
                segments.push("tail");
                let colorPattern = randchoice(
                    Object.keys(colorPatterns)
                );
                // +2 to include head & tail
                let colors = colorPatterns[colorPattern](
                    new Array(segmentCount + 2).fill(null)
                );
                data.fish.push({
                    segments: segments,
                    colors: colors,
                    xvel: randnum(...fishXVelRange),
                    yvel: randnum(...fishYVelRange),
                    xflipTime: randint(...fishXFlipTimeRange),
                    yflipTime: randint(...fishYFlipTimeRange),
                    goingRight: percentChance(50),
                    goingDown: percentChance(50),
                    x: randnum(0, width - fishSegmentSize * segments.length),
                    y: randnum(0, height)
                });
            }

            data.bubblers = [];
            for (let i = 0; i < numBubblers; i++) {
                data.bubblers.push({
                    pos: randnum(0, width)
                });
            }
            data.bubbles = [];

            data.kelp = [];
            let maxKelpSegments = height / (kelpRadius * 2);
            for (let i = 0; i < numKelp; i++) {
                data.kelp.push({
                    pos: randnum(0, width),
                    segments: new Array(
                        randint(6, maxKelpSegments)
                    ).fill(0).map(x => percentChance(50))
                });
            }
        },
        update: (data) => {
            if (time % 10 > 0) return;
            data.mytime++;

            const fss = data.fishSegmentSize;
            
            for (let fish of data.fish) {
                let maxX = width - fss * fish.segments.length;
                fish.x += fish.xvel * (fish.goingRight ? 1 : -1);
                fish.y += fish.yvel * (fish.goingDown  ? 1 : -1);
                if (time % fish.xflipTime === 0 ||
                    fish.x < 0 || fish.x > maxX) {
                    fish.goingRight = !fish.goingRight;
                    fish.xflipTime = 
                        randint(...data.fishXFlipTimeRange);
                }
                if (time % fish.yflipTime === 0 ||
                    fish.y < 0 || fish.y > height) {
                    fish.goingDown = !fish.goingDown;
                    fish.yflipTime =
                        randint(...data.fishYFlipTimeRange);
                }
                if (fish.x < 0) fish.x = 0;
                if (fish.x > maxX) fish.x = maxX;
                if (fish.y < 0) fish.y = 0;
                if (fish.y > height) fish.y = height;
            }

            for (let bubbler of data.bubblers) {
                if (percentChance(data.bubblerChance)) {
                    data.bubbles.push({
                        x: bubbler.pos,
                        y: height,
                        size: randnum(...data.bubbleSizeRange)
                    });
                }
            }

            let bubblesToDelete = [];
            for (let i = 0; i < data.bubbles.length; i++) {
                let bubble = data.bubbles[i];
                bubble.x += randnum(-data.maxBubbleXMove,
                                     data.maxBubbleXMove)
                bubble.y -= randnum(...data.bubbleYMoveRange);
                if (bubble.y < -50)
                    bubblesToDelete.push(i);
            }
            for (let i = bubblesToDelete.length-1; i >= 0; i--) {
                data.bubbles.splice(bubblesToDelete[i], 1);
            }

            for (let kelp of data.kelp) {
                for (let i = 0; i < kelp.segments.length; i++) {
                    if (percentChance(data.kelpChangeChance))
                        kelp.segments[i] = !kelp.segments[i];
                }
            }
        },
        draw: (data) => {
            const fss = data.fishSegmentSize;

            cls("#000");
            for (let fish of data.fish) {
                for (let i = 0; i < fish.segments.length; i++) {
                    let segment = fish.segments[i];
                    let f = data.segTypes[segment] ?? ({
                        head: (x, y) => {
                            let eta = Math.PI / 2;
                            ctx.beginPath();
                            if (fish.goingRight) {
                                ctx.moveTo(x - fss / 2, 
                                           y - fss / 2);
                                ctx.arc(x - fss / 2,
                                        y, fss / 2,
                                        eta, -eta, true);
                            } else {
                                ctx.moveTo(x + fss / 2, 
                                           y - fss / 2);
                                ctx.arc(x + fss / 2,
                                        y, fss / 2,
                                        eta, -eta, false);
                            }
                            ctx.fill();
                        },
                        tail: (x, y) => {
                            let s = fish.goingRight ? 1 : -1;
                            let bx = x + s * fss / 2;
                            let points = [
                                [bx, y],
                                [bx - s * fss / 2, y - fss / 2],
                                [bx - s * fss / 2, y + fss / 2]
                            ];
                            fillPoly(points, ctx.fillStyle);
                        }
                    })[segment];
                    let x;
                    if (fish.goingRight) {
                        x = fish.x - (i + 0.5 - fish.segments.length) * fss;
                    } else {
                        x = fish.x + (i + 0.5) * fss;
                    }
                    let y = fish.y + 0.5 * fss;
                    ctx.fillStyle = fish.colors[i];
                    f(x, y);
                }
            }

            ctx.strokeStyle = "#fff";
            for (let bubble of data.bubbles) {
                ctx.beginPath();
                ctx.arc(bubble.x, bubble.y, bubble.size,
                        0, Math.PI * 2);
                ctx.stroke();
            }

            let qp = Math.PI / 4;
            ctx.strokeStyle = "#0f0";
            let kr = data.kelpRadius;
            for (let kelp of data.kelp) {
                ctx.beginPath();
                for (let i = 0; i < kelp.segments.length; i++) {
                    let y = height - (Math.sqrt(2) * i + 1) * kr;
                    if (kelp.segments[i]) {
                        // right
                        ctx.arc(kelp.pos - kr / Math.sqrt(2), y,
                                kr, qp, -qp, true);
                    } else {
                        // left
                        ctx.arc(kelp.pos + kr / Math.sqrt(2), y,
                                kr, 3 * qp, -3 * qp, false);
                    }
                }
                ctx.stroke();
            }
        }
    }, {
        name: "Hourglass",
        setup: (data) => {
            data.hourglass = [];
            for (let i = 18; i < 37; i++) {
                data.hourglass.push([i, 1]);
                data.hourglass.push([i, 23]);
            }
            for (let i = 1; i < 5; i++) {
                data.hourglass.push([18, i]);
                data.hourglass.push([36, i]);
                data.hourglass.push([18, i + 19]);
                data.hourglass.push([36, i + 19]);
            }
            for (let i = 0; i < 8; i++) {
                data.hourglass.push([19 + i, 5 + i]);
                data.hourglass.push([35 - i, 5 + i]);
                data.hourglass.push([25 - i, 13 + i]);
                data.hourglass.push([29 + i, 13 + i]);
            }
            data.initialSand = [];
            for (let y = 0; y < 8; y++) {
                for (let x = 19 + y; x < 36 - y; x++) {
                    data.initialSand.push([x, y + 4]);
                }
            }
            data.initialSand = data.initialSand.map(
                (n, i) => ({x: n[0], y: n[1]})
            );
            let startcolor = randcolor();
            let endcolor = randcolor();
            data.sand = deepcopy(data.initialSand);
            for (let i = 0; i < data.sand.length; i++) {
                data.sand[i].color = color2hex(colorlerp(
                    startcolor,
                    endcolor,
                    i/data.sand.length
                ));
            }
            data.timer = null;
            data.showColors = false;
            mouseCallback = (x,y,b) => {
                data.showColors = !data.showColors;
            }
        },
        update: (data) => {
            if (time % 10 > 0) return;
            data.sand = shuffled(data.sand);
            let sandMoved = false;
            let hasSandAt = pos => data.sand.some(
                s => s.x === pos[0] && s.y === pos[1]
            );
            let hasWallAt = pos => data.hourglass.some(
                w => w[0] === pos[0] && w[1] === pos[1]
            );
            for (let i = 0; i < data.sand.length; i++) {
                let sandParticle = data.sand[i];
                let {x, y} = sandParticle;
                let below = [x, y + 1];
                let sandBelow = hasSandAt(below);
                let wallBelow = hasWallAt(below);
                if (!sandBelow && !wallBelow) {
                    data.sand[i].y++;
                    sandMoved = true;
                } else {
                    let bl = [x - 1, y + 1];
                    let sandBelowLeft = hasSandAt(bl);
                    let wallBelowLeft = hasWallAt(bl);
                    let wallLeft = hasWallAt([x - 1, y]);
                    let canFallLeft =
                        !sandBelowLeft &&
                        !wallBelowLeft && !wallLeft;
                    let br = [x + 1, y + 1];
                    let sandBelowRight = hasSandAt(br);
                    let wallBelowRight = hasWallAt(br);
                    let wallRight = hasWallAt([x + 1, y]);
                    let canFallRight =
                        !sandBelowRight &&
                        !wallBelowRight && !wallRight;
                    let fallPoss = [];
                    if (canFallLeft)
                        fallPoss.push(-1);
                    if (canFallRight)
                        fallPoss.push(1);
                    if (percentChance(50)) {
                        let b2l = [x - 2, y + 1];
                        let sandB2L = hasSandAt(b2l);
                        let wallB2L = hasWallAt(b2l);
                        let canFall2L =
                            canFallLeft &&
                            !sandB2L && !wallB2L;
                        let b2r = [x + 2, y + 1];
                        let sandB2R = hasSandAt(b2r);
                        let wallB2R = hasWallAt(b2r);
                        let canFall2R =
                            canFallRight &&
                            !sandB2R && !wallB2R;
                        let wideFallPoss = [];
                        if (canFall2L)
                            wideFallPoss.push(-2);
                        if (canFall2R)
                            wideFallPoss.push(2);
                        if (wideFallPoss.length)
                            fallPoss = wideFallPoss;
                    }
                    let fallDir = randchoice(fallPoss);
                    if (!fallDir) continue;
                    data.sand[i].y++;
                    data.sand[i].x += fallDir;
                    sandMoved = true;
                }
            }
            if (!sandMoved) {
                if (data.timer === null) {
                    data.timer = 10;
                } else {
                    data.timer--;
                    if (data.timer === 0) {
                        data.sand = deepcopy(data.initialSand);
                        let startcolor = randcolor();
                        let endcolor = randcolor();
                        for (let i=0; i<data.sand.length; i++) {
                            data.sand[i].color = color2hex(
                                colorlerp(
                                    startcolor,
                                    endcolor,
                                    i/data.sand.length
                                )
                            );
                        }
                        data.timer = null;
                    }
                }
            }
        },
        draw: (data) => {
            cls("#000");
            const size = 20;
            // X: 18 to 36
            // Y: 1 to 23
            const cxf = x => width / 2 + (x - 27) * size
            const cyf = y => height / 2 + (y - 12) * size
            for (let sandParticle of data.sand) {
                let color = "#fc0";
                if (data.showColors)
                    color = sandParticle.color;
                fillCircle(cxf(sandParticle.x),
                           cyf(sandParticle.y),
                           size / 2, color);
            }
            ctx.fillStyle = "#8cc";
            for (let hourglassPart of data.hourglass) {
                let cx = cxf(hourglassPart[0]);
                let cy = cyf(hourglassPart[1]);
                ctx.fillRect(cx - size / 2,
                             cy - size / 2,
                             size, size);
            }
        }
    }
]);

let currentScreensaver = null;
let data = {};
let selected = 0;
let mouseCallback = () => {};
let time = 0;

canvas.addEventListener("click", (event) => {
    let rect = event.target.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    if (currentScreensaver === null) {
        if (x >= width / 2 - 80 && x <= width / 2 + 80 &&
            y >= height - 100 && y <= height - 20) {
            currentScreensaver = selected;
            data = {};
            SCREENSAVERS[selected].setup(data);
        }
        if (x >= 40 && x <= 80 &&
            y >= height / 2 - 40 && y <= height / 2 + 40) {
            selected--;
            if (selected < 0) selected += SCREENSAVERS.length;
        }
        if (x >= width - 80 && x <= width - 40 &&
            y >= height / 2 - 40 && y <= height / 2 + 40) {
            selected++;
            selected %= SCREENSAVERS.length;
        }
    } else {
        mouseCallback(x, y, false);
    }
});
canvas.addEventListener("contextmenu", (event) => {
    if (currentScreensaver !== null) {
        let rect = event.target.getBoundingClientRect();
        mouseCallback(event.clientX - rect.left,
                      event.clientY - rect.top,
                      true);
        event.preventDefault();
    }
})

document.addEventListener("keydown", (event) => {
    if (currentScreensaver === null) {
        if (event.code === "ArrowLeft") {
            selected--;
            if (selected < 0) selected += SCREENSAVERS.length;
        }
        if (event.code === "ArrowRight") {
            selected++;
            selected %= SCREENSAVERS.length;
        }
        if (event.code === "Space" || event.code === "Enter") {
            event.preventDefault();
            currentScreensaver = selected;
            data = {};
            SCREENSAVERS[selected].setup(data);
        }
    } else {
        if (event.code === "Escape") currentScreensaver = null;
    }
});

setInterval(() => {
    if (currentScreensaver === null) {
        mouseCallback = () => {};
        ctx.lineWidth = 1;
        ctx.strokeStyle = "";
        ctx.fillStyle = "";
        cls("#444");
        writeCentered(SCREENSAVERS[selected].name, width / 2, height / 2, "#fff");
        fillPoly([
            [40, height / 2],
            [80, height / 2 - 40],
            [80, height / 2 + 40]
        ], "#fff");
        fillPoly([
            [width - 40, height / 2],
            [width - 80, height / 2 - 40],
            [width - 80, height / 2 + 40]
        ], "#fff");
        fillPoly([
            [width / 2 - 80, height - 100],
            [width / 2 + 80, height - 100],
            [width / 2 + 80, height - 20],
            [width / 2 - 80, height - 20]
        ], "#888");
        writeCentered("Start", width / 2, height - 60, "#fff");
    } else {
        let ssdata = SCREENSAVERS[currentScreensaver];
        ssdata.update(data);
        ssdata.draw(data);
    }
    time++;
}, 1);