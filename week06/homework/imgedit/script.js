const fileInput = document.getElementById("fileInput");
const chooseBtn = document.getElementById("chooseBtn");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");

const previewImg = document.getElementById("previewImg");
const placeholder = document.getElementById("placeholder");

const filterButtons = document.querySelectorAll(".filter-btn");
const filterName = document.getElementById("filterName");
const filterValue = document.getElementById("filterValue");
const filterSlider = document.getElementById("filterSlider");

const rotateLeftBtn = document.getElementById("rotateLeft");
const rotateRightBtn = document.getElementById("rotateRight");
const flipHorizontalBtn = document.getElementById("flipHorizontal");
const flipVerticalBtn = document.getElementById("flipVertical");

// 当前编辑状态
let brightness = 100;
let saturation = 100;
let inversion = 0;
let grayscale = 0;
let rotate = 0;
let flipX = 1;
let flipY = 1;

let activeFilter = "brightness";
let imageLoaded = false;

// 记录原始图片
let originalImage = new Image();
let currentImageURL = "";

// 滤镜信息配置
const filterConfig = {
  brightness: {
    label: "亮度",
    min: 0,
    max: 200,
    get value() {
      return brightness;
    },
    set value(val) {
      brightness = val;
    }
  },
  saturation: {
    label: "饱和度",
    min: 0,
    max: 200,
    get value() {
      return saturation;
    },
    set value(val) {
      saturation = val;
    }
  },
  inversion: {
    label: "反相",
    min: 0,
    max: 100,
    get value() {
      return inversion;
    },
    set value(val) {
      inversion = val;
    }
  },
  grayscale: {
    label: "灰度",
    min: 0,
    max: 100,
    get value() {
      return grayscale;
    },
    set value(val) {
      grayscale = val;
    }
  }
};

// 应用样式到预览图
function applyFilters() {
  previewImg.style.filter = `
    brightness(${brightness}%)
    saturate(${saturation}%)
    invert(${inversion}%)
    grayscale(${grayscale}%)
  `;

  previewImg.style.transform = `
    rotate(${rotate}deg)
    scale(${flipX}, ${flipY})
  `;
}

// 更新滑块显示
function updateSliderUI() {
  const config = filterConfig[activeFilter];
  filterName.textContent = config.label;
  filterSlider.min = config.min;
  filterSlider.max = config.max;
  filterSlider.value = config.value;
  filterValue.textContent = `${config.value}%`;
}

// 切换当前滤镜
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    updateSliderUI();
  });
});

// 滑块变化
filterSlider.addEventListener("input", (e) => {
  const value = Number(e.target.value);
  filterConfig[activeFilter].value = value;
  filterValue.textContent = `${value}%`;
  applyFilters();
});

// 选择图片
chooseBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  if (currentImageURL) {
    URL.revokeObjectURL(currentImageURL);
  }

  currentImageURL = URL.createObjectURL(file);
  previewImg.src = currentImageURL;
  originalImage.src = currentImageURL;

  previewImg.onload = () => {
    imageLoaded = true;
    previewImg.style.display = "block";
    placeholder.style.display = "none";
    resetEditor();
  };
});

// 旋转
rotateLeftBtn.addEventListener("click", () => {
  if (!imageLoaded) return;
  rotate -= 90;
  applyFilters();
});

rotateRightBtn.addEventListener("click", () => {
  if (!imageLoaded) return;
  rotate += 90;
  applyFilters();
});

// 翻转
flipHorizontalBtn.addEventListener("click", () => {
  if (!imageLoaded) return;
  flipX = flipX === 1 ? -1 : 1;
  applyFilters();
});

flipVerticalBtn.addEventListener("click", () => {
  if (!imageLoaded) return;
  flipY = flipY === 1 ? -1 : 1;
  applyFilters();
});

// 重置
function resetEditor() {
  brightness = 100;
  saturation = 100;
  inversion = 0;
  grayscale = 0;
  rotate = 0;
  flipX = 1;
  flipY = 1;
  activeFilter = "brightness";

  filterButtons.forEach((item) => item.classList.remove("active"));
  document
    .querySelector('.filter-btn[data-filter="brightness"]')
    .classList.add("active");

  updateSliderUI();
  applyFilters();
}

resetBtn.addEventListener("click", () => {
  if (!imageLoaded) return;
  resetEditor();
});

// 保存图片
saveBtn.addEventListener("click", () => {
  if (!imageLoaded) {
    alert("请先选择一张图片");
    return;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const img = originalImage;

  // 根据旋转角度决定画布大小
  const normalizedRotate = ((rotate % 360) + 360) % 360;
  const isVertical = normalizedRotate === 90 || normalizedRotate === 270;

  canvas.width = isVertical ? img.height : img.width;
  canvas.height = isVertical ? img.width : img.height;

  // 移动坐标原点到画布中心
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(flipX, flipY);

  // 应用滤镜
  ctx.filter = `
    brightness(${brightness}%)
    saturate(${saturation}%)
    invert(${inversion}%)
    grayscale(${grayscale}%)
  `;

  // 绘制图片
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  const link = document.createElement("a");
  link.download = "edited-image.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// 初始化
updateSliderUI();