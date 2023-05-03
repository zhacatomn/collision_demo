const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MIN_MULTIPLIER = 1;
const MAX_MULTIPLIER = 5;
const MIN_ENTITIES = 3;
const MAX_ENTITIES = 50;
const COLOURS = ["blue", "red", "green"];
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const entities = [];

let numEntities = 3;
let collisionCntTotal = 0;

class Circle {
  static defaultSpeed = 5;
  static defaultRadius = 20;
  constructor(x, y, angle, colour = "red", speedMultiplier = 1) {
    this.radius = Circle.defaultRadius;
    this.speedX = speedMultiplier * Circle.defaultSpeed * Math.cos(angle);
    this.speedY = speedMultiplier * Circle.defaultSpeed * Math.sin(angle);
    this.x = x;
    this.y = y;
    this.colour = colour;
    this.prevCollidedEntity = null;
  }

  static generateRandomX() {
    return (
      Math.floor(Math.random() * (CANVAS_WIDTH - 2 * Circle.defaultRadius)) +
      Circle.defaultRadius
    );
  }

  static generateRandomY() {
    return (
      Math.floor(Math.random() * (CANVAS_HEIGHT - 2 * Circle.defaultRadius)) +
      Circle.defaultRadius
    );
  }

  isCollideWith(otherCircle) {
    // Checking for collision, with an additional threshold variable
    const additionalThreshold = 0;
    return (
      (this.x - otherCircle.x) ** 2 + (this.y - otherCircle.y) ** 2 <=
      (this.radius + otherCircle.radius + additionalThreshold) ** 2
    );
  }

  move() {
    this.x += this.speedX;
    this.y += this.speedY;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = this.colour;
    ctx.fill();
    ctx.closePath();
  }
}

const createNewEntity = (speedMultiplier = 1) => {
  const circle = new Circle(
    Circle.generateRandomX(),
    Circle.generateRandomY(),
    Math.random() * 360,
    COLOURS[entities.length % 3],
    speedMultiplier
  );

  for (let j = 0; j < entities.length; j++) {
    if (!circle.isCollideWith(entities[j])) {
      continue;
    }
    circle.x = Circle.generateRandomX();
    circle.y = Circle.generateRandomY();
    j = 0;
  }
  entities.push(circle);
};

const handleWallCollision = () => {
  for (const ent of entities) {
    if (ent.x + ent.radius >= CANVAS_WIDTH || ent.x - ent.radius <= 0) {
      ent.speedX =
        (ent.x + ent.radius >= CANVAS_WIDTH ? -1 : 1) * Math.abs(ent.speedX);
      ent.prevCollidedEntity = null;
    }
    if (ent.y + ent.radius >= CANVAS_HEIGHT || ent.y - ent.radius <= 0) {
      ent.speedY =
        (ent.y + ent.radius >= CANVAS_HEIGHT ? -1 : 1) * Math.abs(ent.speedY);
      ent.prevCollidedEntity = null;
    }
  }
};

const handleCircleCollision = () => {
  let hasTriCollision = false;
  const hasCollidedEntityIdx = new Array(numEntities).fill(false);
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const ent1 = entities[i];
      const ent2 = entities[j];
      if (
        !ent1.isCollideWith(ent2) ||
        (ent1.prevCollidedEntity === ent2 && ent2.prevCollidedEntity === ent1)
      ) {
        continue;
      }
      ent1.prevCollidedEntity = ent2;
      ent2.prevCollidedEntity = ent1;
      if (hasCollidedEntityIdx[i] || hasCollidedEntityIdx[j]) {
        hasTriCollision = true;
      }
      hasCollidedEntityIdx[i] = hasCollidedEntityIdx[j] = true;
      collisionCntTotal++;
      const theta =
        Math.PI / 2 -
        (ent1.x == ent2.x
          ? 0
          : ent1.y == ent2.y
          ? Math.PI / 2
          : Math.atan((ent1.y - ent2.y) / (ent1.x - ent2.x)));
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      [ent1.speedX, ent1.speedY, ent2.speedX, ent2.speedY] = [
        ent1.speedX * cosTheta ** 2 -
          ent1.speedY * (sinTheta * cosTheta) +
          ent2.speedX * sinTheta ** 2 +
          ent2.speedY * (cosTheta * sinTheta),
        -ent1.speedX * sinTheta * cosTheta +
          ent1.speedY * sinTheta ** 2 +
          ent2.speedX * (sinTheta * cosTheta) +
          ent2.speedY * cosTheta ** 2,
        ent2.speedX * cosTheta ** 2 -
          ent2.speedY * (sinTheta * cosTheta) +
          ent1.speedX * sinTheta ** 2 +
          ent1.speedY * (cosTheta * sinTheta),
        -ent2.speedX * sinTheta * cosTheta +
          ent2.speedY * sinTheta ** 2 +
          ent1.speedX * (sinTheta * cosTheta) +
          ent1.speedY * cosTheta ** 2,
      ];
      // Separating the 2 elements so they are not colliding anymore
      const dist = Math.sqrt((ent1.x - ent2.x) ** 2 + (ent1.y - ent2.y) ** 2);
      ent2.x +=
        (ent2.x >= ent1.x ? 1 : -1) *
        (2 * Circle.defaultRadius - dist) *
        Math.abs(sinTheta);
      ent2.y +=
        (ent2.y >= ent1.y ? 1 : -1) *
        (2 * Circle.defaultRadius - dist) *
        Math.abs(cosTheta);
    }
  }
  return hasTriCollision;
};

const mainLoop = (callbackOnEnd) => () => {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  for (const ent of entities) {
    ent.move();
  }
  handleWallCollision();
  let hasTriCollision = handleCircleCollision();
  for (const ent of entities) {
    ent.draw();
  }
  const collisionCntEle = document.getElementById("collision-cnt");
  collisionCntEle.innerHTML = collisionCntTotal;
  // Terminating if all spheres collide
  if (hasTriCollision) {
    callbackOnEnd();
    document.getElementById("end-message").style.display = "block";
    return;
  }
  window.requestAnimationFrame(mainLoop(callbackOnEnd));
};

const init = () => {
  // Setting speed control event listeners
  let currMultiplier = 1;
  const speedUpBtn = document.getElementById("speed-up");
  const slowDownBtn = document.getElementById("slow-down");
  const multiplierEle = document.getElementById("multiplier");
  const updateSpeed = (prevMulti, currMulti) => {
    for (ent of entities) {
      ent.speedX *= currMulti / prevMulti;
      ent.speedY *= currMulti / prevMulti;
    }
    multiplierEle.innerHTML = currMulti;
  };
  speedUpBtn.addEventListener("click", () => {
    const prevMultiplier = currMultiplier;
    currMultiplier += 1;
    updateSpeed(prevMultiplier, currMultiplier);
    if (currMultiplier >= MAX_MULTIPLIER) {
      speedUpBtn.disabled = true;
    }
    slowDownBtn.disabled = false;
  });
  slowDownBtn.addEventListener("click", () => {
    const prevMultiplier = currMultiplier;
    currMultiplier -= 1;
    updateSpeed(prevMultiplier, currMultiplier);
    if (currMultiplier <= MIN_MULTIPLIER) {
      slowDownBtn.disabled = true;
    }
    speedUpBtn.disabled = false;
  });

  // Setting entity count listener
  const entityCntEle = document.getElementById("entity-cnt");
  entityCntEle.addEventListener("focusout", () => {
    let numEntitiesNew = parseInt(entityCntEle.value);
    if (numEntitiesNew == null || isNaN(numEntitiesNew)) {
      entityCntEle.value = numEntities;
      return;
    }
    numEntitiesNew = Math.min(
      Math.max(numEntitiesNew, MIN_ENTITIES),
      MAX_ENTITIES
    );
    const diff = Math.abs(numEntities - numEntitiesNew);
    if (numEntitiesNew < numEntities) {
      for (let i = 0; i < diff; i++) {
        entities.pop();
      }
    }
    if (numEntitiesNew > numEntities) {
      for (let i = 0; i < diff; i++) {
        createNewEntity(currMultiplier);
      }
    }
    numEntities = numEntitiesNew;
    entityCntEle.value = numEntities;
  });

  // Setting time elapsed interval
  let timeElapsed = 0;
  const minElapsedEle = document.getElementById("elapsed-min");
  const secElapsedEle = document.getElementById("elapsed-sec");

  const timeElapsedIntervalId = window.setInterval(() => {
    timeElapsed += currMultiplier;
    const secElapsedStr = (timeElapsed % 60).toString();
    const minElapsedStr = Math.floor(timeElapsed / 60).toString();
    minElapsedEle.innerHTML =
      (minElapsedStr.length === 1 ? "0" : "") + minElapsedStr;
    secElapsedEle.innerHTML =
      (secElapsedStr.length === 1 ? "0" : "") + secElapsedStr;
  }, 1000);

  // Creating circle entities
  for (let i = 0; i < numEntities; i++) {
    createNewEntity();
  }

  const cleanUp = () => {
    window.clearInterval(timeElapsedIntervalId);
    speedUpBtn.disabled = slowDownBtn.disabled = true;
    entityCntEle.disabled = true;
  };

  window.requestAnimationFrame(mainLoop(cleanUp));
};

init();
