// Campaign Poster Generator Engine
// Built for 4th Reunion Design Frame

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('posterCanvas');
  const ctx = canvas.getContext('2d');

  // Input Elements
  const photoInput = document.getElementById('photoInput');
  const dropZone = document.getElementById('dropZone');
  const zoomRange = document.getElementById('zoomRange');
  const zoomVal = document.getElementById('zoomVal');
  const rotateRange = document.getElementById('rotateRange');
  const rotateVal = document.getElementById('rotateVal');
  const nameInput = document.getElementById('nameInput');
  const taglineInput = document.getElementById('taglineInput');
  const showBadgeBg = document.getElementById('showBadgeBg');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');
  const frameInput = document.getElementById('frameInput');
  const statusText = document.getElementById('statusText');

  // Circle Geometry on the 1024x1024 template
  const CIRCLE_CX = 511.5;
  const CIRCLE_CY = 511.5;
  const CIRCLE_R = 287; // Perfect radius matching golden border with zero gap

  // State
  let userImage = null;
  let frameImage = new Image();
  let frameLoaded = false;

  // Photo Transform State
  let photoState = {
    x: CIRCLE_CX,
    y: CIRCLE_CY,
    scale: 1,
    rotation: 0 // degrees
  };

  // Dragging State
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialPhotoX = 0;
  let initialPhotoY = 0;

  // Load default template frame
  frameImage.crossOrigin = 'anonymous';
  frameImage.src = 'assets/template_frame.png';
  frameImage.onload = () => {
    frameLoaded = true;
    updateStatus('টেমপ্লেট লোড হয়েছে! আপনার ছবি আপলোড করুন');
    render();
  };

  frameImage.onerror = () => {
    updateStatus('টেমপ্লেট ফ্রেম পাওয়া যায়নি, ডিফল্ট ব্যাকগ্রাউন্ড রেন্ডার হচ্ছে');
    render();
  };

  // Helper status updater
  function updateStatus(msg) {
    if (statusText) statusText.textContent = msg;
  }

  // Handle Photo File Loading
  function loadUserPhoto(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('দয়া করে একটি সঠিক ইমেজ ফাইল (JPG/PNG/WebP) সিলেক্ট করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        userImage = img;
        // Calculate initial auto-fit scale for circle
        const minDim = Math.min(img.width, img.height);
        const targetSize = CIRCLE_R * 2;
        const initialScale = Math.max(0.5, (targetSize / minDim) * 1.05);

        photoState = {
          x: CIRCLE_CX,
          y: CIRCLE_CY,
          scale: parseFloat(initialScale.toFixed(2)),
          rotation: 0
        };

        zoomRange.value = photoState.scale;
        zoomVal.textContent = `${photoState.scale.toFixed(1)}x`;
        rotateRange.value = 0;
        rotateVal.textContent = '0°';

        updateStatus('ছবি সফলভাবে যুক্ত হয়েছে! প্রয়োজনে টেনে পজিশন ঠিক করুন');
        render();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Event Listeners for Upload
  const choosePhotoBtn = document.getElementById('choosePhotoBtn');
  if (choosePhotoBtn) {
    choosePhotoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      photoInput.click();
    });
  }

  dropZone.addEventListener('click', (e) => {
    if (e.target !== choosePhotoBtn) {
      photoInput.click();
    }
  });

  photoInput.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  photoInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      loadUserPhoto(e.target.files[0]);
    }
  });

  // Drag and Drop support
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    canvas.addEventListener(eventName, (e) => {
      e.preventDefault();
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt.files && dt.files[0]) {
      loadUserPhoto(dt.files[0]);
    }
  });

  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (dt.files && dt.files[0]) {
      loadUserPhoto(dt.files[0]);
    }
  });

  // Sliders
  zoomRange.addEventListener('input', (e) => {
    photoState.scale = parseFloat(e.target.value);
    zoomVal.textContent = `${photoState.scale.toFixed(1)}x`;
    render();
  });

  rotateRange.addEventListener('input', (e) => {
    photoState.rotation = parseInt(e.target.value, 10);
    rotateVal.textContent = `${photoState.rotation}°`;
    render();
  });

  const namePosSelect = document.getElementById('namePosSelect');
  const circleBgSelect = document.getElementById('circleBgSelect');
  const fitCircleBtn = document.getElementById('fitCircleBtn');
  const centerPhotoBtn = document.getElementById('centerPhotoBtn');

  // Quick Tools
  if (fitCircleBtn) {
    fitCircleBtn.addEventListener('click', () => {
      if (!userImage) return;
      const targetSize = CIRCLE_R * 2;
      const fitScale = Math.max(targetSize / userImage.width, targetSize / userImage.height) * 1.05;
      photoState.scale = parseFloat(fitScale.toFixed(2));
      photoState.x = CIRCLE_CX;
      photoState.y = CIRCLE_CY;
      zoomRange.value = photoState.scale;
      zoomVal.textContent = `${photoState.scale.toFixed(1)}x`;
      render();
    });
  }

  if (centerPhotoBtn) {
    centerPhotoBtn.addEventListener('click', () => {
      photoState.x = CIRCLE_CX;
      photoState.y = CIRCLE_CY;
      render();
    });
  }

  // Text Inputs and Selects
  nameInput.addEventListener('input', render);
  taglineInput.addEventListener('input', render);
  namePosSelect.addEventListener('change', render);
  if (circleBgSelect) circleBgSelect.addEventListener('change', render);
  showBadgeBg.addEventListener('change', render);

  // Mouse & Touch Dragging on Canvas to Pan Image
  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function startDrag(e) {
    if (!userImage) return;
    const pos = getCanvasPos(e);
    // Check if clicked near circular area or anywhere inside canvas
    isDragging = true;
    dragStartX = pos.x;
    dragStartY = pos.y;
    initialPhotoX = photoState.x;
    initialPhotoY = photoState.y;
    canvas.style.cursor = 'grabbing';
  }

  function doDrag(e) {
    if (!isDragging || !userImage) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    const dx = pos.x - dragStartX;
    const dy = pos.y - dragStartY;
    photoState.x = initialPhotoX + dx;
    photoState.y = initialPhotoY + dy;
    render();
  }

  function stopDrag() {
    isDragging = false;
    canvas.style.cursor = 'grab';
  }

  canvas.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', doDrag);
  window.addEventListener('mouseup', stopDrag);

  canvas.addEventListener('touchstart', startDrag, { passive: false });
  window.addEventListener('touchmove', doDrag, { passive: false });
  window.addEventListener('touchend', stopDrag);

  // Custom Frame Upload
  frameInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const customImg = new Image();
        customImg.onload = () => {
          frameImage = customImg;
          frameLoaded = true;
          updateStatus('কাস্টম ফ্রেম সফলভাবে আপলোড হয়েছে!');
          render();
        };
        customImg.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Reset Button
  resetBtn.addEventListener('click', () => {
    nameInput.value = '';
    taglineInput.value = '';
    userImage = null;
    photoInput.value = '';
    photoState = { x: CIRCLE_CX, y: CIRCLE_CY, scale: 1, rotation: 0 };
    zoomRange.value = 1;
    zoomVal.textContent = '1.0x';
    rotateRange.value = 0;
    rotateVal.textContent = '0°';
    updateStatus('সবকিছু রিসেট করা হয়েছে');
    render();
  });

  // Download Button
  downloadBtn.addEventListener('click', () => {
    // Render at full quality
    render();
    const link = document.createElement('a');
    const safeName = (nameInput.value.trim() || 'reunion_poster')
      .replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, '_');
    link.download = `${safeName}_poster.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    updateStatus('পোস্টার ডাউনলোড সম্পন্ন হয়েছে! 🎉');
  });

  // Main Render Function
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Background
    ctx.fillStyle = '#15092a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw User Photo inside Circular Mask
    if (userImage) {
      ctx.save();
      // Define circular clipping area
      ctx.beginPath();
      ctx.arc(CIRCLE_CX, CIRCLE_CY, CIRCLE_R, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      // Draw backdrop inside circle to eliminate any empty/blank space
      const bgChoice = circleBgSelect ? circleBgSelect.value : 'studio';
      if (bgChoice === 'studio') {
        const radGrad = ctx.createRadialGradient(CIRCLE_CX, CIRCLE_CY - 30, 30, CIRCLE_CX, CIRCLE_CY, CIRCLE_R);
        radGrad.addColorStop(0, '#3f2168');
        radGrad.addColorStop(0.55, '#251242');
        radGrad.addColorStop(1, '#15092a');
        ctx.fillStyle = radGrad;
        ctx.fillRect(CIRCLE_CX - CIRCLE_R, CIRCLE_CY - CIRCLE_R, CIRCLE_R * 2, CIRCLE_R * 2);
      } else if (bgChoice === 'blur') {
        // Ambient blurred version of user photo filling 100% of circle
        ctx.save();
        ctx.filter = 'blur(24px) brightness(0.8)';
        const blurScale = Math.max((CIRCLE_R * 2.5) / userImage.width, (CIRCLE_R * 2.5) / userImage.height);
        ctx.drawImage(
          userImage,
          CIRCLE_CX - (userImage.width * blurScale) / 2,
          CIRCLE_CY - (userImage.height * blurScale) / 2,
          userImage.width * blurScale,
          userImage.height * blurScale
        );
        ctx.restore();
      } else if (bgChoice === 'dark') {
        ctx.fillStyle = '#15092a';
        ctx.fillRect(CIRCLE_CX - CIRCLE_R, CIRCLE_CY - CIRCLE_R, CIRCLE_R * 2, CIRCLE_R * 2);
      } else {
        // white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(CIRCLE_CX - CIRCLE_R, CIRCLE_CY - CIRCLE_R, CIRCLE_R * 2, CIRCLE_R * 2);
      }

      // Apply transformations to photo
      ctx.translate(photoState.x, photoState.y);
      ctx.rotate((photoState.rotation * Math.PI) / 180);
      ctx.scale(photoState.scale, photoState.scale);

      // Draw photo centered on its transformation anchor
      ctx.drawImage(
        userImage,
        -userImage.width / 2,
        -userImage.height / 2,
        userImage.width,
        userImage.height
      );

      ctx.restore();
    } else {
      // Empty placeholder inside circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(CIRCLE_CX, CIRCLE_CY, CIRCLE_R, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();

      // Placeholder Icon & Text
      ctx.fillStyle = '#a78bfa';
      ctx.font = '500 24px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('এখানে আপনার ছবি বসবে', CIRCLE_CX, CIRCLE_CY - 10);
      ctx.font = '400 16px "Hind Siliguri", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('বাম পাশের প্যানেল থেকে ছবি আপলোড করুন', CIRCLE_CX, CIRCLE_CY + 24);
      ctx.restore();
    }

    // 3. Draw Template Frame Overlay (Banner, Border, 4th Reunion Badge, Bottom Waves)
    if (frameLoaded && frameImage.complete && frameImage.naturalWidth > 0) {
      ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
    }

    // 4. Draw User Name & Tagline Badge (Bottom Right Area)
    const nameText = nameInput.value.trim();
    const taglineText = taglineInput.value.trim();

    if (nameText || taglineText) {
      drawNameBadge(nameText, taglineText);
    }
  }

  // Draw Stylized Name Badge
  function drawNameBadge(name, tagline) {
    const posChoice = namePosSelect ? namePosSelect.value : 'bottom-right';
    if (posChoice === 'none') return;

    ctx.save();

    // Determine badge position based on choice
    let badgeX = 760;
    let badgeY = 845;
    if (posChoice === 'bottom-center') {
      badgeX = 512;
      badgeY = 880;
    }

    // Dynamic width calculation based on text
    ctx.font = '700 26px "Hind Siliguri", "Outfit", sans-serif';
    const nameMeasure = ctx.measureText(name || '');
    ctx.font = '600 15px "Hind Siliguri", "Outfit", sans-serif';
    const tagMeasure = ctx.measureText(tagline || '');
    const maxTextWidth = Math.max(nameMeasure.width, tagMeasure.width);

    // Padding + limits
    const badgeWidth = Math.min(480, Math.max(280, maxTextWidth + 60));
    const badgeHeight = tagline ? 82 : 56;

    // Optional Glassmorphic Name Plate Background
    if (showBadgeBg.checked) {
      ctx.save();
      ctx.translate(badgeX, badgeY);

      // Drop shadow for plate
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 6;

      // Plate Background Gradient (Deep violet with gold tint)
      const grad = ctx.createLinearGradient(-badgeWidth / 2, 0, badgeWidth / 2, 0);
      grad.addColorStop(0, 'rgba(30, 10, 60, 0.92)');
      grad.addColorStop(0.5, 'rgba(48, 16, 95, 0.95)');
      grad.addColorStop(1, 'rgba(30, 10, 60, 0.92)');

      ctx.fillStyle = grad;
      roundRect(ctx, -badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight, 14);
      ctx.fill();

      // Border gradient (Golden glow)
      const borderGrad = ctx.createLinearGradient(-badgeWidth / 2, 0, badgeWidth / 2, 0);
      borderGrad.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
      borderGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.9)');
      borderGrad.addColorStop(1, 'rgba(245, 158, 11, 0.3)');

      ctx.lineWidth = 2;
      ctx.strokeStyle = borderGrad;
      roundRect(ctx, -badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight, 14);
      ctx.stroke();

      ctx.restore();
    }

    // Text Alignment
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw Name
    if (name) {
      ctx.save();
      const nameY = tagline ? badgeY - 14 : badgeY;

      // Text Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      ctx.font = '700 28px "Hind Siliguri", "Outfit", sans-serif';

      // Name Text Gradient (White to subtle Gold)
      const textGrad = ctx.createLinearGradient(badgeX - 150, 0, badgeX + 150, 0);
      textGrad.addColorStop(0, '#ffffff');
      textGrad.addColorStop(0.5, '#fef08a');
      textGrad.addColorStop(1, '#ffffff');

      ctx.fillStyle = textGrad;
      ctx.fillText(name, badgeX, nameY);
      ctx.restore();
    }

    // Draw Tagline / Batch
    if (tagline) {
      ctx.save();
      const tagY = badgeY + 20;
      ctx.font = '600 16px "Hind Siliguri", "Outfit", sans-serif';
      ctx.fillStyle = '#e9d5ff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(tagline, badgeX, tagY);
      ctx.restore();
    }

    ctx.restore();
  }

  // Utility to draw rounded rectangles on Canvas
  function roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

  // Initial Render
  render();
});
