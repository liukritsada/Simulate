/**
 * 🚀 SSE Manager - Real-time Status Updates
 * 
 * File: js/sse-manager.js
 * 
 * ✅ Fixed version - No conflict with existing code
 * ✅ Works alongside 12-auto-assignment-system.js
 * 
 * Usage:
 * SSEManager.initSSE(71); // Start SSE for station 71
 * SSEManager.stopSSE();  // Stop SSE
 */

// ===== CREATE NAMESPACE TO AVOID CONFLICTS =====
const SSEManager = (function() {
    
    // ===== PRIVATE VARIABLES =====
    let sseSource = null;
    let sseStationId = null;
    let lastMessageTime = Date.now();
    let pollingFallbackInterval = null;
    
    // ===== CONFIGURATION =====
    const CONFIG = {
        apiEndpoint: '/hospital/api/status_stream.php',
        reconnectDelay: 5000,
        heartbeatTimeout: 10000,
        pollingInterval: 5000
    };
    
    // ===== PUBLIC METHODS =====
    return {
        
        /**
         * Initialize SSE Connection
         */
        initSSE: function(stationId) {
            console.log(`🚀 [SSE] Initializing for Station ${stationId}`);
            
            // Close existing connection
            if (sseSource) {
                sseSource.close();
                sseSource = null;
            }
            
            // Clear polling
            if (pollingFallbackInterval) {
                clearInterval(pollingFallbackInterval);
                pollingFallbackInterval = null;
            }
            
            sseStationId = stationId;
            lastMessageTime = Date.now();
            
            // Build URL
            const url = `${CONFIG.apiEndpoint}?station_id=${stationId}&t=${Date.now()}`;
            
            // Create EventSource
            sseSource = new EventSource(url);
            
            // Message handler
            sseSource.onmessage = (event) => {
                lastMessageTime = Date.now();
                
                try {
                    const data = JSON.parse(event.data);
                    
                    if (!data) return;
                    
                    console.log(`📡 [SSE] Status Update:`, data);
                    
                    // Handle update
                    if (data.type === 'status_update') {
                        this._handleStatusUpdate(data);
                    } else if (data.type === 'error') {
                        console.error('❌ [SSE] Server Error:', data.message);
                    }
                    
                } catch (error) {
                    console.error('❌ [SSE] Parse error:', error);
                }
            };
            
            // Error handler
            sseSource.onerror = (error) => {
                console.error('❌ [SSE] Connection Error:', error);
                
                if (sseSource) {
                    sseSource.close();
                    sseSource = null;
                }
                
                // Fallback to polling
                console.log('📍 [SSE] Switching to polling...');
                this._startPollingFallback(stationId);
            };
            
            // Heartbeat check
            this._setHeartbeatCheck();
            
            console.log(`✅ [SSE] Connected to Station ${stationId}`);
        },
        
        /**
         * Stop SSE
         */
        stopSSE: function() {
            console.log('🛑 [SSE] Stopping');
            
            if (sseSource) {
                sseSource.close();
                sseSource = null;
            }
            
            if (pollingFallbackInterval) {
                clearInterval(pollingFallbackInterval);
                pollingFallbackInterval = null;
            }
            
            sseStationId = null;
        },
        
        /**
         * Get SSE Status
         */
        getStatus: function() {
            return {
                isConnected: sseSource !== null,
                stationId: sseStationId,
                isPollingFallback: pollingFallbackInterval !== null,
                lastMessageTime: lastMessageTime
            };
        },
        
        /**
         * Private: Handle Status Update
         */
        _handleStatusUpdate: function(response) {
            if (!response.data || response.data.length === 0) {
                return;
            }
            
            console.log(`📊 [SSE] Updating ${response.data.length} staff member(s)`);
            
            // Update each doctor
            response.data.forEach((doctor, index) => {
                this._updateDoctorUI(doctor, index);
            });
            
            // Update timestamp
            this._updateLastUpdatedTime(response.timestamp);
        },
        
        /**
         * Private: Update Doctor UI
         */
        _updateDoctorUI: function(doctor, index) {
            // Find room element
            const roomEl = document.querySelector(
                `[data-doctor-id="${doctor.doctor_id}"], ` +
                `[data-station-doctor-id="${doctor.station_doctor_id}"]`
            );
            
            if (!roomEl) {
                return;
            }
            
            // Update doctor name
            const nameEl = roomEl.querySelector('.doctor-name, .staff-name, [data-field="doctor_name"]');
            if (nameEl && nameEl.textContent !== doctor.doctor_name) {
                nameEl.textContent = doctor.doctor_name;
            }
            
            // Update status
            const statusEl = roomEl.querySelector('.status-badge, [data-field="status"]');
            if (statusEl) {
                statusEl.textContent = doctor.status;
                statusEl.className = `status-badge status-${doctor.status}`;
            }
            
            // Update time info
            const timeEl = roomEl.querySelector('.time-info, [data-field="time"]');
            if (timeEl) {
                timeEl.textContent = `In: ${doctor.time_in || 'N/A'} | Out: ${doctor.time_out || 'N/A'}`;
            }
            
            // Highlight change
            if (roomEl.classList) {
                roomEl.classList.add('highlight');
                setTimeout(() => {
                    roomEl.classList.remove('highlight');
                }, 1000);
            }
            
            // Show notification (first update only)
            if (index === 0) {
                console.log(`✅ [SSE] ${doctor.doctor_name} - ${doctor.status}`);
            }
        },
        
        /**
         * Private: Update Last Updated Time
         */
        _updateLastUpdatedTime: function(timestamp) {
            const elements = document.querySelectorAll(
                '.last-update-time, ' +
                '[data-field="last-update"], ' +
                '.timestamp-info'
            );
            
            elements.forEach(el => {
                el.textContent = `Last updated: ${timestamp}`;
            });
        },
        
        /**
         * Private: Set Heartbeat Check
         */
        _setHeartbeatCheck: function() {
            setInterval(() => {
                const timeSinceLastMessage = Date.now() - lastMessageTime;
                
                if (timeSinceLastMessage > CONFIG.heartbeatTimeout && sseStationId) {
                    console.warn(`⚠️ [SSE] No messages for ${(timeSinceLastMessage / 1000).toFixed(1)}s`);
                    
                    // Reconnect
                    this.initSSE(sseStationId);
                }
            }, 5000);
        },
        
        /**
         * Private: Polling Fallback
         */
        _startPollingFallback: function(stationId) {
            console.log('⏱️ [SSE] Polling every 5 seconds');
            
            if (pollingFallbackInterval) {
                clearInterval(pollingFallbackInterval);
            }
            
            pollingFallbackInterval = setInterval(async () => {
                try {
                    const response = await fetch(
                        `/hospital/api/get_station_detail.php?station_id=${stationId}`
                    );
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    if (data.success && data.data) {
                        if (data.data.doctors && Array.isArray(data.data.doctors)) {
                            data.data.doctors.forEach((doctor, index) => {
                                this._updateDoctorUI(doctor, index);
                            });
                            
                            this._updateLastUpdatedTime(new Date().toLocaleTimeString());
                        }
                    }
                    
                } catch (error) {
                    console.error('📍 [SSE] Polling error:', error);
                }
            }, CONFIG.pollingInterval);
        }
    };
})();

// ===== EVENT LISTENERS =====

// Handle page unload
window.addEventListener('beforeunload', () => {
    console.log('👋 [SSE] Page unloading');
    SSEManager.stopSSE();
});

// Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('👁️ [SSE] Page hidden - pausing');
        SSEManager.stopSSE();
    } else {
        console.log('👁️ [SSE] Page visible - resuming');
        const status = SSEManager.getStatus();
        if (status.stationId && !status.isConnected) {
            SSEManager.initSSE(status.stationId);
        }
    }
});

console.log('✅ [SSE] Manager loaded. Call SSEManager.initSSE(stationId) to start.');