/**
 * LearnMate AI - Rewards Store & Gamification Engine
 * Handles XP point redemption for demo coupons, streak tracking, and coupon wallet.
 */

const RewardsStore = {
    render() {
        const container = document.getElementById("rewards-view");
        if (!container) return;

        const profile = StorageManager.getProfile();
        const catalog = REWARDS_CATALOG;
        const myCoupons = profile.redeemedCoupons || [];

        let content = `
            <div class="view-header">
                <div>
                    <h2 class="view-title">Rewards Center & Gamification Store</h2>
                    <p class="view-subtitle">Redeem your hard-earned study and quiz XP for real perks, coupons, and achievement badges.</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="App.navigateTo('quiz')">
                        ⚡ Take Quiz to Earn XP
                    </button>
                </div>
            </div>

            <!-- Gamification Status Banner -->
            <div class="card rewards-status-banner mb-6">
                <div class="grid-3 gap-4">
                    <div class="status-box">
                        <span class="status-box-icon">🪙</span>
                        <div class="status-box-data">
                            <span class="status-box-label">Available XP Balance</span>
                            <h3 class="status-box-val text-primary" id="rewards-balance-val">${profile.points} XP</h3>
                        </div>
                    </div>

                    <div class="status-box">
                        <span class="status-box-icon">🔥</span>
                        <div class="status-box-data">
                            <span class="status-box-label">Current Study Streak</span>
                            <h3 class="status-box-val text-warning">${profile.streak} Days</h3>
                        </div>
                    </div>

                    <div class="status-box">
                        <span class="status-box-icon">🎟️</span>
                        <div class="status-box-data">
                            <span class="status-box-label">Active Coupons</span>
                            <h3 class="status-box-val text-success">${myCoupons.length} Claimed</h3>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Rewards Catalog Grid -->
            <div class="section-title-wrap mb-4">
                <h3 class="section-title">Available Rewards & Demo Coupons</h3>
                <p class="section-subtitle">Earn 15-50 XP per quiz and 25 XP per completed study session.</p>
            </div>

            <div class="grid-3 gap-6 mb-6">
                ${catalog.map(item => {
                    const canAfford = (profile.points || 0) >= item.cost;
                    const needed = item.cost - (profile.points || 0);

                    return `
                        <div class="card reward-card ${canAfford ? 'can-afford' : 'cannot-afford'}">
                            ${item.popular ? `<span class="popular-ribbon">POPULAR</span>` : ""}
                            
                            <div class="reward-icon-wrapper">
                                <span class="reward-big-icon">${item.icon}</span>
                            </div>

                            <div class="reward-content">
                                <span class="badge badge-secondary mb-2">${item.category}</span>
                                <h4 class="reward-title">${item.title}</h4>
                                <p class="reward-desc">${item.description}</p>
                            </div>

                            <div class="reward-footer flex-between mt-4">
                                <div class="reward-price">
                                    <span class="coin-icon">🪙</span>
                                    <strong>${item.cost} XP</strong>
                                </div>

                                ${canAfford ? `
                                    <button class="btn btn-sm btn-primary" onclick="RewardsStore.confirmRedeem('${item.id}')">
                                        Redeem Pass
                                    </button>
                                ` : `
                                    <button class="btn btn-sm btn-disabled" title="Need ${needed} more XP" onclick="App.showToast('You need ${needed} more XP to claim this reward! Complete a quiz to earn points.', 'warning')">
                                        Need ${needed} XP
                                    </button>
                                `}
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>

            <!-- Redeemed Coupons Wallet -->
            <div class="card">
                <div class="card-header flex-between">
                    <div>
                        <h3 class="card-title">My Redeemed Coupons Wallet</h3>
                        <p class="card-subtitle">Show these promo codes to redeem at campus facilities or partner apps.</p>
                    </div>
                    <span class="badge badge-info">${myCoupons.length} Coupons</span>
                </div>

                ${myCoupons.length > 0 ? `
                    <div class="coupons-grid grid-2 gap-4 mt-4">
                        ${myCoupons.map(c => `
                            <div class="coupon-ticket card">
                                <div class="ticket-left">
                                    <span class="ticket-icon">${c.icon || '🎟️'}</span>
                                </div>
                                <div class="ticket-middle">
                                    <h4 class="ticket-title">${escapeHtml(c.title)}</h4>
                                    <div class="ticket-code-wrap">
                                        <code class="ticket-code">${c.code}</code>
                                        <button class="btn btn-xs btn-outline" onclick="RewardsStore.copyCode('${c.code}')">Copy</button>
                                    </div>
                                    <span class="ticket-meta text-muted small">Redeemed: ${c.date} • Expires: ${c.expires}</span>
                                </div>
                                <div class="ticket-right">
                                    <span class="badge badge-success-soft">ACTIVE</span>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                ` : `
                    <div class="empty-state p-6">
                        <div class="empty-icon">🎟️</div>
                        <h3>No Coupons Redeemed Yet</h3>
                        <p>Complete quizzes and finish study tasks to rack up XP coins, then redeem them here!</p>
                    </div>
                `}
            </div>
        `;

        container.innerHTML = content;
    },

    confirmRedeem(rewardId) {
        const item = REWARDS_CATALOG.find(r => r.id === rewardId);
        if (!item) return;

        const profile = StorageManager.getProfile();
        if ((profile.points || 0) < item.cost) {
            App.showToast(`Insufficient XP. You need ${item.cost - profile.points} more XP.`, "warning");
            return;
        }

        const modalHtml = `
            <div class="modal-overlay" id="redeem-modal" onclick="RewardsStore.closeModalOnOverlay(event)">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3 class="modal-title">Confirm Reward Redemption</h3>
                        <button class="modal-close" onclick="RewardsStore.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body text-center">
                        <span class="text-6xl mb-3 block">${item.icon}</span>
                        <h4>Redeem "${item.title}"?</h4>
                        <p class="text-muted mt-2">${item.description}</p>
                        <div class="redeem-cost-box my-4">
                            <span>Cost: <strong>${item.cost} XP</strong></span>
                            <span class="mx-2">|</span>
                            <span>Remaining after: <strong>${profile.points - item.cost} XP</strong></span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="RewardsStore.closeModal()">Cancel</button>
                        <button class="btn btn-success" onclick="RewardsStore.executeRedeem('${item.id}')">Confirm & Claim</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("modal-container").innerHTML = modalHtml;
    },

    executeRedeem(rewardId) {
        const item = REWARDS_CATALOG.find(r => r.id === rewardId);
        if (!item) return;

        const success = StorageManager.deductPoints(item.cost);
        if (!success) {
            App.showToast("Insufficient XP coins.", "danger");
            return;
        }

        // Generate unique coupon code e.g. LM-PIZZA-8219
        const randStr = Math.floor(1000 + Math.random() * 9000);
        const prefix = item.title.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "PASS");
        const couponCode = `LM-${prefix}-${randStr}`;

        const newCoupon = {
            id: `cpn-${Date.now()}`,
            title: item.title,
            code: couponCode,
            cost: item.cost,
            date: "Just now",
            expires: "In 7 days",
            icon: item.icon
        };

        const profile = StorageManager.getProfile();
        if (!profile.redeemedCoupons) profile.redeemedCoupons = [];
        profile.redeemedCoupons.unshift(newCoupon);
        StorageManager.saveProfile(profile);

        this.closeModal();
        this.render();
        App.updateDashboardMetrics();

        // FX celebration!
        if (window.FXEngine) {
            FXEngine.confettiBurst(0.5, 0.4, 80);
            FXEngine.playCoinSound();
        }

        // Show congrats modal with code!
        this.showClaimSuccessModal(newCoupon);
    },

    showClaimSuccessModal(coupon) {
        const modalHtml = `
            <div class="modal-overlay" id="claim-success-modal" onclick="RewardsStore.closeModalOnOverlay(event)">
                <div class="modal-card text-center">
                    <div class="modal-header">
                        <h3 class="modal-title">🎉 Reward Unlocked!</h3>
                        <button class="modal-close" onclick="RewardsStore.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <span class="text-6xl mb-2 block">${coupon.icon}</span>
                        <h4>${escapeHtml(coupon.title)}</h4>
                        <p class="text-muted mt-1">Present this code at checkout or apply it in partner app:</p>

                        <div class="coupon-display-box my-4 p-4 border rounded">
                            <span class="ticket-code-big">${coupon.code}</span>
                            <div class="mt-2">
                                <button class="btn btn-sm btn-primary" onclick="RewardsStore.copyCode('${coupon.code}')">
                                    📋 Copy Code
                                </button>
                            </div>
                        </div>

                        <p class="text-muted small">Valid for 7 days. Stored in your Redeemed Coupons wallet.</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="RewardsStore.closeModal()">Awesome!</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("modal-container").innerHTML = modalHtml;
        App.showToast(`Reward unlocked: ${coupon.title}!`, "success");
    },

    copyCode(code) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
                App.showToast(`Code ${code} copied to clipboard!`, "success");
            }).catch(() => {
                prompt("Copy your coupon code:", code);
            });
        } else {
            prompt("Copy your coupon code:", code);
        }
    },

    closeModal() {
        const modal = document.querySelector(".modal-overlay");
        if (modal) modal.remove();
    },

    closeModalOnOverlay(e) {
        if (e.target.classList.contains("modal-overlay")) {
            this.closeModal();
        }
    }
};

