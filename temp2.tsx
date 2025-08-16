                  </div>
                </div>

                {/* Weekly Stats */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Weekly Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 text-center border border-blue-100">
                      <div className="text-2xl mb-2">📊</div>
                      <div className="text-2xl font-black text-blue-600">{Math.round(driver.earnings.week / 7)}</div>
                      <div className="text-sm font-semibold text-blue-800">Avg Daily</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 text-center border border-purple-100">
                      <div className="text-2xl mb-2">🎯</div>
                      <div className="text-2xl font-black text-purple-600">{Math.round(driver.totalDeliveries / 7)}</div>
                      <div className="text-sm font-semibold text-purple-800">Deliveries/Day</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'profile' && (
            <div className="pb-24 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-b-3xl shadow-xl">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{driver.name}</h1>
                    <p className="text-blue-100 text-lg font-medium">{driver.email}</p>
                    <div className="flex items-center space-x-1 text-sm bg-blue-700/80 backdrop-blur-sm px-3 py-1 rounded-full mt-2">
                      <Star className="w-4 h-4 text-yellow-300" />
                      <span className="font-semibold">{driver.rating} • {driver.totalDeliveries} deliveries</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Driver Stats */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100">
                  <h3 className="font-bold text-xl text-blue-900 mb-4">Driver Performance</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <div className="text-2xl font-black text-gray-900">{driver.rating}</div>
                      </div>
                      <div className="text-xs text-gray-600 font-semibold">Rating</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-2xl font-black text-blue-600">{driver.totalDeliveries}</div>
                      <div className="text-xs text-gray-600 font-semibold">Deliveries</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-2xl font-black text-green-600">99%</div>
                      <div className="text-xs text-gray-600 font-semibold">On Time</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-xl font-black text-purple-600">${(driver.earnings.month / driver.totalDeliveries * 30).toFixed(2)}</div>
                      <div className="text-xs text-gray-600 font-semibold">Avg per Delivery</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-xl font-black text-orange-600">{Math.round(driver.earnings.totalMilesDriven / driver.totalDeliveries * 100)}</div>
                      <div className="text-xs text-gray-600 font-semibold">Miles per Order</div>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Full Name</span>
                      <span className="font-semibold text-gray-900">{driver.name}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Email</span>
                      <span className="font-semibold text-gray-900">{driver.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Phone</span>
                      <span className="font-semibold text-gray-900">{driver.phone}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="font-medium text-gray-700">Driver ID</span>
                      <span className="font-semibold text-gray-900">{driver.id}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal('editProfile')}
                    className="w-full mt-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Edit Information</span>
                  </button>
                </div>

                {/* Vehicle Information */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Vehicle Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Make & Model</span>
                      <span className="font-semibold text-gray-900">{driver.vehicle.year} {driver.vehicle.make} {driver.vehicle.model}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Color</span>
                      <span className="font-semibold text-gray-900">{driver.vehicle.color}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="font-medium text-gray-700">License Plate</span>
                      <span className="font-semibold text-gray-900">{driver.vehicle.licensePlate}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal('editVehicle')}
                    className="w-full mt-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Car className="w-5 h-5" />
                    <span>Update Vehicle</span>
                  </button>
                </div>

                {/* App Settings */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">App Settings</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Push Notifications', icon: Bell, enabled: true },
                      { label: 'Location Services', icon: MapPin, enabled: true },
                      { label: 'Auto-Accept Orders', icon: Timer, enabled: false },
                      { label: 'Night Mode', icon: Settings, enabled: false }
                    ].map((setting, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <setting.icon className="w-5 h-5 text-gray-500" />
                          <span className="font-medium text-gray-700">{setting.label}</span>
                        </div>
                        <div className={`w-12 h-6 rounded-full relative transition-colors ${
                          setting.enabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            setting.enabled ? 'translate-x-7' : 'translate-x-1'
                          }`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Work Schedule */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Work Schedule</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Status</span>
                      <span className={`font-semibold ${driver.isOnline ? 'text-green-600' : 'text-gray-600'}`}>
                        {driver.isOnline ? '🟢 Online' : '🔴 Offline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Schedule Mode</span>
                      <span className="font-semibold text-gray-900">
                        {driver.schedule.isScheduled ? 'Scheduled' : 'On-Demand'}
                      </span>
                    </div>
                    {driver.schedule.isScheduled && (
                      <>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <span className="font-medium text-gray-700">Start Time</span>
                          <span className="font-semibold text-gray-900">{driver.schedule.startTime}</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <span className="font-medium text-gray-700">End Time</span>
                          <span className="font-semibold text-gray-900">{driver.schedule.endTime}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal('manageSchedule')}
                    className="w-full mt-6 bg-blue-100 text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Manage Schedule</span>
                  </button>
                </div>

                {/* Support & Help */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Support & Help</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Help Center', icon: HelpCircle, subtitle: 'FAQs and guides' },
                      { label: 'Contact Support', icon: MessageCircle, subtitle: '24/7 driver support' },
                      { label: 'Report Issue', icon: AlertTriangle, subtitle: 'Technical problems' },
                      { label: 'Driver Resources', icon: Award, subtitle: 'Tips and training' }
                    ].map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => alert(`${item.label} would be implemented here`)}
                        className="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        <item.icon className="w-6 h-6 text-gray-500" />
                        <div className="flex-1">
                          <div className="font-bold text-gray-900">{item.label}</div>
                          <div className="text-sm text-gray-600">{item.subtitle}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account Actions */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => alert('Account settings would be managed here')}
                      className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Shield className="w-5 h-5" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full bg-red-500 text-white py-4 rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-4 flex justify-around shadow-xl">
            {[
              { id: 'home', icon: Home, label: 'Home' },
              { id: 'active-delivery', icon: Route, label: 'Delivery', disabled: !activeOrder },
              { id: 'earnings', icon: DollarSign, label: 'Earnings' },
              { id: 'profile', icon: User, label: 'Profile' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => !item.disabled && setCurrentView(item.id)}
                disabled={item.disabled}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  currentView === item.id 
                    ? 'bg-blue-100 text-blue-700' 
                    : item.disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-semibold">{item.label}</span>
                {item.id === 'active-delivery' && activeOrder && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Modal Components */}
      {isAuthenticated && (
        <>
          <EditProfileModal />
          <EditVehicleModal />
          <WithdrawEarningsModal />
          <ScheduleModal />
          <PayoutSettingsModal />
          <ChangeBankAccountModal />
          <BankingTransferModal />
        </>
      )}
    </div>
  );
};

export default FadedSkiesDriverApp;
