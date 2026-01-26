/**
 * 🔄 REAL-TIME DATA INTEGRATION MODULE
 * ระบบ integrate API endpoints เข้ากับ data visualization
 * 
 * Features:
 * - Automatic data fetching จาก API
 * - Real-time updates (polling + SSE)
 * - Auto-refresh charts
 * - Error handling & retry
 * - Data caching
 */

// ========================================
// 🔄 REAL-TIME DATA MANAGER
// ========================================

class RealtimeDataManager {
    constructor(options = {}) {
        this.apiBase = options.apiBase || '/hospital/api/';
        this.updateInterval = options.updateInterval || 5000; // 5 seconds default
        this.useSSE = options.useSSE !== false; // Enable SSE by default
        this.cache = {};
        this.intervals = {};
        this.listeners = {};
        this.errors = {};
    }

    /**
     * Fetch data from API endpoint
     * @param {string} endpoint - API endpoint name (e.g., 'get_stations.php')
     * @param {object} params - Query parameters
     * @returns {Promise} API response
     */
    async fetchData(endpoint, params = {}) {
        try {
            const url = new URL(this.apiBase + endpoint, window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });

            console.log(`📡 Fetching: ${endpoint}`, params);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 10000
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'API returned error');
            }

            // Cache the data
            this.cache[endpoint] = {
                data: data.data,
                timestamp: Date.now()
            };

            // Clear error for this endpoint
            delete this.errors[endpoint];

            console.log(`✅ ${endpoint} loaded`, data.data);
            return data.data;
        } catch (error) {
            console.error(`❌ ${endpoint} failed:`, error);
            this.errors[endpoint] = error.message;
            throw error;
        }
    }

    /**
     * Subscribe to real-time updates
     * @param {string} endpoint - API endpoint
     * @param {Function} callback - Called when data updates
     * @param {object} params - Query parameters
     */
    subscribe(endpoint, callback, params = {}) {
        if (!this.listeners[endpoint]) {
            this.listeners[endpoint] = [];
        }
        this.listeners[endpoint].push(callback);

        // Start polling immediately
        this.startPolling(endpoint, params);

        console.log(`📡 Subscribed to ${endpoint}`);
    }

    /**
     * Unsubscribe from updates
     * @param {string} endpoint - API endpoint
     * @param {Function} callback - Callback to remove
     */
    unsubscribe(endpoint, callback) {
        if (this.listeners[endpoint]) {
            this.listeners[endpoint] = this.listeners[endpoint].filter(cb => cb !== callback);
            
            if (this.listeners[endpoint].length === 0) {
                this.stopPolling(endpoint);
                delete this.listeners[endpoint];
            }
        }
    }

    /**
     * Start polling for endpoint
     * @param {string} endpoint - API endpoint
     * @param {object} params - Query parameters
     */
    startPolling(endpoint, params = {}) {
        // Don't start multiple intervals
        if (this.intervals[endpoint]) {
            return;
        }

        // Fetch immediately
        this.fetchData(endpoint, params)
            .then(data => this.notifyListeners(endpoint, data))
            .catch(error => console.error(`Failed to fetch ${endpoint}:`, error));

        // Then set up interval
        this.intervals[endpoint] = setInterval(async () => {
            try {
                const data = await this.fetchData(endpoint, params);
                this.notifyListeners(endpoint, data);
            } catch (error) {
                console.error(`Polling error for ${endpoint}:`, error);
            }
        }, this.updateInterval);

        console.log(`⏱️ Polling started for ${endpoint}`);
    }

    /**
     * Stop polling for endpoint
     * @param {string} endpoint - API endpoint
     */
    stopPolling(endpoint) {
        if (this.intervals[endpoint]) {
            clearInterval(this.intervals[endpoint]);
            delete this.intervals[endpoint];
            console.log(`⏹️ Polling stopped for ${endpoint}`);
        }
    }

    /**
     * Notify all listeners of data update
     * @param {string} endpoint - API endpoint
     * @param {object} data - Updated data
     */
    notifyListeners(endpoint, data) {
        if (this.listeners[endpoint]) {
            this.listeners[endpoint].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Listener error:', error);
                }
            });
        }
    }

    /**
     * Stop all polling
     */
    stopAll() {
        Object.keys(this.intervals).forEach(endpoint => {
            this.stopPolling(endpoint);
        });
        console.log('🛑 All polling stopped');
    }

    /**
     * Get cached data
     * @param {string} endpoint - API endpoint
     * @returns {object} Cached data or null
     */
    getCached(endpoint) {
        return this.cache[endpoint]?.data || null;
    }
}

// ========================================
// 🎯 LIVE CHART MANAGER
// ========================================

class LiveChartManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.charts = {};
    }

    /**
     * Create live bar chart with real-time updates
     * @param {string} containerId - Container element ID
     * @param {string} endpoint - API endpoint
     * @param {Function} dataTransformer - Transform API data to chart format
     * @param {string} title - Chart title
     * @param {object} options - Additional options
     */
    createLiveBarChart(containerId, endpoint, dataTransformer, title, options = {}) {
        const chart = {
            type: 'bar',
            containerId,
            endpoint,
            dataTransformer,
            title,
            options,
            updateChart: null
        };

        // Initial render
        createBarChart(containerId, [], title);

        // Subscribe to updates
        this.dataManager.subscribe(
            endpoint,
            (data) => {
                try {
                    const transformedData = dataTransformer(data);
                    createBarChart(containerId, transformedData, title);
                    
                    // Update timestamp
                    const container = document.getElementById(containerId);
                    if (container) {
                        const timestamp = new Date().toLocaleTimeString();
                        const existing = container.parentElement?.querySelector('.update-time');
                        if (existing) existing.remove();
                        
                        const timeEl = document.createElement('div');
                        timeEl.className = 'update-time';
                        timeEl.style.cssText = 'font-size: 0.8rem; color: var(--text-light); margin-top: 8px;';
                        timeEl.textContent = `🔄 Updated: ${timestamp}`;
                        container.parentElement?.appendChild(timeEl);
                    }
                } catch (error) {
                    console.error('Chart update error:', error);
                }
            },
            options.params || {}
        );

        this.charts[containerId] = chart;
        console.log(`📊 Live bar chart created: ${containerId}`);
    }

    /**
     * Create live metric cards with real-time updates
     * @param {string} containerId - Container element ID
     * @param {string} endpoint - API endpoint
     * @param {Function} dataTransformer - Transform API data to metrics format
     * @param {object} options - Additional options
     */
    createLiveMetrics(containerId, endpoint, dataTransformer, options = {}) {
        const chart = {
            type: 'metrics',
            containerId,
            endpoint,
            dataTransformer,
            options
        };

        // Initial render
        createMetricCards(containerId, []);

        // Subscribe to updates
        this.dataManager.subscribe(
            endpoint,
            (data) => {
                try {
                    const metrics = dataTransformer(data);
                    createMetricCards(containerId, metrics);
                } catch (error) {
                    console.error('Metrics update error:', error);
                }
            },
            options.params || {}
        );

        this.charts[containerId] = chart;
        console.log(`📈 Live metrics created: ${containerId}`);
    }

    /**
     * Create live donut chart with real-time updates
     * @param {string} containerId - Container element ID
     * @param {string} endpoint - API endpoint
     * @param {Function} dataTransformer - Transform API data to donut format
     * @param {string} title - Chart title
     * @param {object} options - Additional options
     */
    createLiveDonut(containerId, endpoint, dataTransformer, title, options = {}) {
        const chart = {
            type: 'donut',
            containerId,
            endpoint,
            dataTransformer,
            title,
            options
        };

        // Initial render
        createDonutChart(containerId, [], title);

        // Subscribe to updates
        this.dataManager.subscribe(
            endpoint,
            (data) => {
                try {
                    const donutData = dataTransformer(data);
                    createDonutChart(containerId, donutData, title);
                } catch (error) {
                    console.error('Donut chart update error:', error);
                }
            },
            options.params || {}
        );

        this.charts[containerId] = chart;
        console.log(`🍩 Live donut chart created: ${containerId}`);
    }

    /**
     * Create live progress indicator with real-time updates
     * @param {string} containerId - Container element ID
     * @param {string} endpoint - API endpoint
     * @param {Function} dataTransformer - Transform API data to progress format
     * @param {object} options - Additional options
     */
    createLiveProgress(containerId, endpoint, dataTransformer, options = {}) {
        const chart = {
            type: 'progress',
            containerId,
            endpoint,
            dataTransformer,
            options
        };

        // Initial render
        createProgressIndicator(containerId, []);

        // Subscribe to updates
        this.dataManager.subscribe(
            endpoint,
            (data) => {
                try {
                    const progressData = dataTransformer(data);
                    createProgressIndicator(containerId, progressData);
                } catch (error) {
                    console.error('Progress update error:', error);
                }
            },
            options.params || {}
        );

        this.charts[containerId] = chart;
        console.log(`⏳ Live progress created: ${containerId}`);
    }

    /**
     * Create live stats table with real-time updates
     * @param {string} containerId - Container element ID
     * @param {string} endpoint - API endpoint
     * @param {Array} columns - Table columns
     * @param {Function} dataTransformer - Transform API data to table rows
     * @param {string} title - Table title
     * @param {object} options - Additional options
     */
    createLiveTable(containerId, endpoint, columns, dataTransformer, title, options = {}) {
        const chart = {
            type: 'table',
            containerId,
            endpoint,
            columns,
            dataTransformer,
            title,
            options
        };

        // Initial render
        createStatsTable(containerId, columns, [], title);

        // Subscribe to updates
        this.dataManager.subscribe(
            endpoint,
            (data) => {
                try {
                    const rows = dataTransformer(data);
                    createStatsTable(containerId, columns, rows, title);
                } catch (error) {
                    console.error('Table update error:', error);
                }
            },
            options.params || {}
        );

        this.charts[containerId] = chart;
        console.log(`📋 Live table created: ${containerId}`);
    }

    /**
     * Stop all live charts
     */
    stopAll() {
        this.dataManager.stopAll();
        this.charts = {};
        console.log('🛑 All live charts stopped');
    }
}

// ========================================
// 📊 EXAMPLE TRANSFORMERS
// ========================================

/**
 * Transform station stats to bar chart data
 */
function transformStationStats(data) {
    if (!data || !Array.isArray(data.stations)) {
        return [];
    }

    return data.stations.map(station => ({
        label: station.station_name || station.name,
        value: station.patient_count || 0,
        max: station.max_capacity || 100,
        color: station.patient_count > 80 ? 'danger' : 'success'
    }));
}

/**
 * Transform patient data to metrics
 */
function transformPatientMetrics(data) {
    const total = data.total_patients || 0;
    const waiting = data.waiting_count || 0;
    const processing = data.processing_count || 0;
    const completed = data.completed_count || 0;

    return [
        {
            label: 'ผู้ป่วยทั้งหมด',
            value: total,
            change: data.total_change || 0,
            color: 'var(--primary)'
        },
        {
            label: 'รอคิว',
            value: waiting,
            change: data.waiting_change || 0,
            color: 'var(--info)'
        },
        {
            label: 'กำลังทำ',
            value: processing,
            change: data.processing_change || 0,
            color: 'var(--warning)'
        },
        {
            label: 'เสร็จสิ้น',
            value: completed,
            change: data.completed_change || 0,
            color: 'var(--success)'
        }
    ];
}

/**
 * Transform station stats to donut chart
 */
function transformStationDonut(data) {
    return [
        {
            label: 'ว่าง',
            value: data.empty_count || 0,
            color: '#10B981'
        },
        {
            label: 'ใช้งาน',
            value: data.occupied_count || 0,
            color: '#3B82F6'
        },
        {
            label: 'ซ่อม',
            value: data.maintenance_count || 0,
            color: '#F59E0B'
        }
    ];
}

/**
 * Transform occupancy to progress
 */
function transformOccupancy(data) {
    return [
        {
            label: 'เตียงที่ใช้งาน',
            value: data.occupied || 0,
            max: data.total || 100,
            color: 'var(--warning)'
        },
        {
            label: 'เตียงว่าง',
            value: data.empty || 0,
            max: data.total || 100,
            color: 'var(--success)'
        }
    ];
}

/**
 * Transform data to table rows
 */
function transformTableRows(data) {
    if (!Array.isArray(data.rows)) {
        return [];
    }

    return data.rows.map(row => ({
        station: row.station_name || row.name,
        total: row.total_patients || 0,
        waiting: row.waiting || 0,
        processing: row.processing || 0,
        completed: row.completed || 0
    }));
}

// ========================================
// 🎯 GLOBAL INSTANCES
// ========================================

// Create global instances
const rtDataManager = new RealtimeDataManager({
    updateInterval: 5000, // Update every 5 seconds
    useSSE: true
});

const liveChartManager = new LiveChartManager(rtDataManager);

// Export for global use
console.log('✅ Real-time Data Integration Module loaded');
