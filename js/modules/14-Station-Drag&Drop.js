/**
 * 🎯 Station Drag & Drop Ordering Module (PERFORMANCE OPTIMIZED)
 * จัดลำดับ Station ได้แบบอิสระ
 * 
 * ✅ Fixed Performance Issues:
 * - Replaced busy waiting with MutationObserver
 * - Removed redundant function wrapping
 * - Optimized event listener initialization
 * - Better DOM detection strategy
 */

let draggedStation = null;
let stationOrderMap = {};
let mutationObserver = null;
let dragDropInitialized = false;

// ========================================
// ✅ INIT DRAG & DROP (NO BUSY WAITING)
// ========================================

function initStationDragDrop(floorNumber) {
  console.log(`🎯 Initializing drag & drop for Floor ${floorNumber}`);

  let container = findContainerForFloor(floorNumber);
  if (!container) {
    console.warn(`⚠️ Container not found for floor ${floorNumber}`);
    return;
  }

  console.log(`✅ Found container for floor ${floorNumber}:`, container.id);

  const stationCards = container.querySelectorAll('[data-station-id]');
  if (stationCards.length === 0) {
    console.info(`ℹ️ Floor ${floorNumber} has no stations`);
    return;
  }

  console.log(`📍 Found ${stationCards.length} station cards on floor ${floorNumber}`);

  stationCards.forEach((card) => {
    if (card.getAttribute('data-dragdrop-init') === 'true') return;

    card.draggable = true;
    card.style.cursor = 'grab';
    card.setAttribute('data-dragdrop-init', 'true');

    card.addEventListener('dragstart', handleDragStart, false);
    card.addEventListener('dragend', handleDragEnd, false);
    card.addEventListener('dragover', handleDragOver, false);
    card.addEventListener('drop', handleDrop, false);
    card.addEventListener('dragenter', handleDragEnter, false);
    card.addEventListener('dragleave', handleDragLeave, false);
  });

  console.log(`✅ Drag & drop enabled for ${stationCards.length} stations on floor ${floorNumber}`);
}

// ========================================
// ✅ CONTAINER FINDER
// ========================================

function findContainerForFloor(floorNumber) {
  let container = document.getElementById(`floor${floorNumber}-stations`);
  if (container) return container;
  
  container = document.getElementById(`floor${floorNumber}Stations`);
  if (container) return container;
  
  container = document.querySelector(`[data-floor="${floorNumber}"]`);
  if (container) return container;
  
  container = document.querySelector(`.floor-${floorNumber}-stations`);
  if (container) return container;
  
  return null;
}

// ========================================
// ✅ DRAG EVENT HANDLERS
// ========================================

function handleDragStart(e) {
  draggedStation = this;
  this.style.opacity = '0.5';
  this.style.cursor = 'grabbing';
  this.style.transform = 'scale(0.95)';
  this.classList.add('dragging');
  
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);

  const stationId = this.getAttribute('data-station-id');
  const stationName = this.getAttribute('data-station-name') || 'Unknown';
  console.log(`🎯 Dragging: [${stationId}] ${stationName}`);
}

function handleDragEnd(e) {
  this.style.opacity = '1';
  this.style.cursor = 'grab';
  this.style.transform = 'scale(1)';
  this.classList.remove('dragging');

  document.querySelectorAll('[data-station-id]').forEach((card) => {
    card.style.borderTop = '';
    card.style.backgroundColor = '';
    card.classList.remove('drag-over');
  });

  draggedStation = null;
  console.log(`✅ Drag ended`);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  if (this !== draggedStation && this.getAttribute('data-station-id')) {
    this.style.borderTop = '3px solid #0066cc';
    this.style.backgroundColor = 'rgba(0, 102, 204, 0.05)';
    this.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  if (this !== draggedStation) {
    this.style.borderTop = '';
    this.style.backgroundColor = '';
    this.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  const dropTarget = this;

  if (draggedStation !== dropTarget && dropTarget.getAttribute('data-station-id')) {
    const draggedParent = draggedStation.parentNode;
    const dropParent = dropTarget.parentNode;

    const floorNumber = draggedStation.getAttribute('data-floor') || 
                      dropTarget.getAttribute('data-floor');

    console.log(`🔄 Swapping: floor ${floorNumber}`);

    if (draggedParent === dropParent) {
      const allCards = Array.from(draggedParent.children);
      const draggedIndex = allCards.indexOf(draggedStation);
      const dropIndex = allCards.indexOf(dropTarget);

      if (draggedIndex < dropIndex) {
        dropTarget.parentNode.insertBefore(draggedStation, dropTarget.nextSibling);
      } else {
        dropTarget.parentNode.insertBefore(draggedStation, dropTarget);
      }

      console.log(`✅ Swapped positions: ${draggedIndex} <-> ${dropIndex}`);
      saveStationOrder(floorNumber);
    }
  }

  this.style.borderTop = '';
  this.style.backgroundColor = '';
  this.classList.remove('drag-over');

  return false;
}

// ========================================
// ✅ SAVE & LOAD ORDER
// ========================================

async function saveStationOrder(floorNumber) {
  try {
    console.log(`💾 Saving station order for floor ${floorNumber}`);

    let container = findContainerForFloor(floorNumber);
    if (!container) {
      console.warn(`⚠️ Container not found for floor ${floorNumber}`);
      return;
    }

    const stationCards = container.querySelectorAll('[data-station-id]');
    const stationOrder = Array.from(stationCards).map((card, index) => ({
      station_id: parseInt(card.getAttribute('data-station-id')),
      order_position: index + 1
    }));

    console.log(`📋 Sending order to API:`, stationOrder);

    const apiUrl = typeof getApiUrl === 'function' 
      ? getApiUrl('save_station_order.php')
      : '/hospital/api/save_station_order.php';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        floor: floorNumber,
        stations: stationOrder
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ Order saved! ${stationOrder.map((s, i) => `#${i + 1}:${s.station_id}`).join(' → ')}`);
    } else {
      console.error(`❌ Failed to save order:`, result.message);
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: '⚠️ บันทึกไม่สำเร็จ',
          text: result.message || 'ไม่สามารถบันทึกลำดับได้',
          icon: 'warning',
          confirmButtonColor: '#ffc107'
        });
      }
    }
  } catch (error) {
    console.error(`❌ Error saving order:`, error);
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: '❌ เกิดข้อผิดพลาด',
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    }
  }
}

async function loadStationOrder(floorNumber) {
  try {
    console.log(`📥 Loading station order for floor ${floorNumber}`);

    const apiUrl = typeof getApiUrl === 'function'
      ? getApiUrl('get_station_order.php')
      : '/hospital/api/get_station_order.php';

    const response = await fetch(`${apiUrl}?floor=${floorNumber}`);
    const result = await response.json();

    if (result.success && result.data && result.data.length > 0) {
      const orderMap = {};
      result.data.forEach((item) => {
        orderMap[item.station_id] = item.order_position;
      });

      stationOrderMap = orderMap;
      console.log(`✅ Loaded order map:`, orderMap);

      reorderStationsInUI(floorNumber, orderMap);
    } else {
      console.log(`⏭️ No custom order saved for floor ${floorNumber}`);
    }
  } catch (error) {
    console.warn(`⚠️ Could not load order for floor ${floorNumber}:`, error.message);
  }
}

function reorderStationsInUI(floorNumber, orderMap) {
  let container = findContainerForFloor(floorNumber);
  if (!container) {
    console.warn(`⚠️ Container not found for reordering floor ${floorNumber}`);
    return;
  }

  const stationCards = Array.from(container.querySelectorAll('[data-station-id]'));

  if (stationCards.length === 0) {
    console.info(`ℹ️ Floor ${floorNumber} has no stations`);
    return;
  }

  stationCards.sort((a, b) => {
    const stationIdA = parseInt(a.getAttribute('data-station-id'));
    const stationIdB = parseInt(b.getAttribute('data-station-id'));

    const orderA = orderMap[stationIdA] || 999;
    const orderB = orderMap[stationIdB] || 999;

    return orderA - orderB;
  });

  stationCards.forEach((card, index) => {
    card.style.animation = `slideIn 0.3s ease ${index * 0.05}s forwards`;
    container.appendChild(card);
  });

  console.log(`✅ Reordered ${stationCards.length} stations for floor ${floorNumber}`);
}

async function resetStationOrder(floorNumber) {
  if (typeof Swal === 'undefined') {
    if (!confirm('คุณต้องการรีเซ็ตลำดับ Station เป็นค่าเริ่มต้นหรือไม่?')) {
      return;
    }
  } else {
    const result = await Swal.fire({
      title: '⚠️ ยืนยันการรีเซ็ต',
      text: 'คุณต้องการรีเซ็ตลำดับ Station เป็นค่าเริ่มต้นหรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'รีเซ็ต',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#FFC107',
      cancelButtonColor: '#6c757d'
    });

    if (!result.isConfirmed) {
      return;
    }
  }

  try {
    console.log(`🔄 Resetting station order for floor ${floorNumber}`);

    const apiUrl = typeof getApiUrl === 'function'
      ? getApiUrl('reset_station_order.php')
      : '/hospital/api/reset_station_order.php';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ floor: floorNumber })
    });

    const resultData = await response.json();

    if (resultData.success) {
      console.log(`✅ Order reset successfully`);

      if (typeof loadStationsByFloor === 'function') {
        await loadStationsByFloor(floorNumber);
      } else if (typeof loadAllFloorsEnhanced === 'function') {
        await loadAllFloorsEnhanced();
      } else {
        window.location.reload();
      }

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: '✅ รีเซ็ตสำเร็จ',
          text: 'ลำดับ Station ถูกรีเซ็ตแล้ว',
          icon: 'success',
          confirmButtonColor: '#0066cc'
        });
      }
    } else {
      throw new Error(resultData.message || 'Failed to reset order');
    }
  } catch (error) {
    console.error(`❌ Error resetting order:`, error);
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: '❌ เกิดข้อผิดพลาด',
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    }
  }
}

// ========================================
// ✅ CSS ANIMATIONS (INJECTED ONCE)
// ========================================

function injectDragDropStyles() {
  const styleId = 'station-dragdrop-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes dragPulse {
      0%, 100% {
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      }
      50% {
        box-shadow: 0 8px 24px rgba(0, 102, 204, 0.3);
      }
    }

    [data-station-id][draggable="true"] {
      transition: all 0.2s ease;
    }

    [data-station-id][draggable="true"]:hover {
      cursor: grab;
      box-shadow: 0 4px 16px rgba(0, 102, 204, 0.2);
      transform: translateY(-2px);
    }

    [data-station-id][draggable="true"]:active {
      cursor: grabbing;
      opacity: 0.8;
    }

    [data-station-id].drag-over {
      border-top: 3px solid #0066cc !important;
      background-color: rgba(0, 102, 204, 0.05) !important;
    }

    [data-station-id].dragging {
      opacity: 0.5;
      transform: scale(0.95);
    }
  `;

  document.head.appendChild(style);
  console.log('✅ Drag & drop styles injected');
}

// ========================================
// ✅ SMART INITIALIZATION (NO POLLING)
// ========================================

function initAllStationDragDrop() {
  if (dragDropInitialized) {
    console.log('⏭️ Drag & drop already initialized');
    return;
  }

  console.log('🚀 Initializing station drag & drop for all floors');

  injectDragDropStyles();

  // ✅ Initialize immediately if stations exist
  const stationCards = document.querySelectorAll('[data-station-id]');
  if (stationCards.length > 0) {
    console.log(`✅ Found ${stationCards.length} stations, initializing...`);
    
    for (let floor = 1; floor <= 6; floor++) {
      loadStationOrder(floor);
      initStationDragDrop(floor);
    }
    
    dragDropInitialized = true;
    console.log('✅ Drag & drop initialized successfully');
    return;
  }

  // ✅ If not yet loaded, watch for DOM changes
  console.log('⏳ Stations not yet loaded, watching for changes...');

  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  mutationObserver = new MutationObserver((mutations) => {
    const stationCards = document.querySelectorAll('[data-station-id]');
    
    if (stationCards.length > 0 && !dragDropInitialized) {
      console.log(`✅ Stations detected (${stationCards.length}), initializing drag & drop...`);
      mutationObserver.disconnect();

      for (let floor = 1; floor <= 6; floor++) {
        loadStationOrder(floor);
        initStationDragDrop(floor);
      }

      dragDropInitialized = true;
      console.log('✅ Drag & drop initialized via MutationObserver');
    }
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  });
}

// ========================================
// ✅ REINITIALIZE ON FLOOR LOAD
// ========================================

function setupFloorReloadHooks() {
  // Hook: loadAllFloorsEnhanced
  if (typeof window.loadAllFloorsEnhanced === 'function' && !window._loadAllFloorsHooked) {
    const original = window.loadAllFloorsEnhanced;
    window.loadAllFloorsEnhanced = async function(...args) {
      const result = await original.apply(this, args);
      dragDropInitialized = false;
      setTimeout(() => {
        console.log('🔄 Reinitializing after loadAllFloorsEnhanced...');
        initAllStationDragDrop();
      }, 300);
      return result;
    };
    window._loadAllFloorsHooked = true;
  }

  // Hook: loadStationsByFloor
  if (typeof window.loadStationsByFloor === 'function' && !window._loadStationsByFloorHooked) {
    const original = window.loadStationsByFloor;
    window.loadStationsByFloor = async function(floor, ...args) {
      const result = await original.apply(this, [floor, ...args]);
      setTimeout(() => {
        console.log(`🔄 Reinitializing floor ${floor}...`);
        initStationDragDrop(floor);
      }, 300);
      return result;
    };
    window._loadStationsByFloorHooked = true;
  }
}

// ========================================
// ✅ AUTO-INITIALIZE
// ========================================

function initializeWhenReady() {
  if (document.readyState === 'loading') {
    console.log('📄 Waiting for DOM...');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✅ DOM ready - initializing drag & drop');
      setupFloorReloadHooks();
      initAllStationDragDrop();
    }, { once: true });
  } else {
    console.log('✅ DOM already loaded - initializing drag & drop');
    setupFloorReloadHooks();
    initAllStationDragDrop();
  }
}

initializeWhenReady();