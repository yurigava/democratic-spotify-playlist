const deviceController = require('../../src/controllers/device')
const deviceService = require('../../src/services/device')
const deviceMock = require('../mocks/pendingVoteDeviceMock')

describe('First time registration of devices', () => {


  let spyCreateRefresherTimeOut;
  let spyGetDevice;
  let spyAddDevice;
  let spyDeleteDevice;

  beforeEach(() => {
    spyCreateRefresherTimeOut = jest.spyOn(deviceController, 'createRefresherTimeOut');
    spyGetDevice = jest.spyOn(deviceService, 'getDevice').mockImplementation((deviceId) => undefined);
    spyAddDevice = jest.spyOn(deviceService, 'addDevice').mockImplementation((deviceId, deviceInfo) => undefined);
    spyDeleteDevice = jest.spyOn(deviceService, 'deleteDevice').mockImplementation((deviceId) => undefined);
  });


  it('After a long period without being registered, the device should be removed', async () => {
    jest.useFakeTimers();

    deviceController.registerDevice('First Device')

    jest.runOnlyPendingTimers();

    expect(spyDeleteDevice).toHaveBeenCalledTimes(1);
    expect(spyDeleteDevice).toHaveBeenCalledWith('First Device');
  })

  it('The fist time a device is registered a timer should be created for removing it', async () => {
    deviceController.registerDevice('First Device');

    expect(spyCreateRefresherTimeOut).toHaveBeenCalledTimes(1);
    expect(spyCreateRefresherTimeOut).toBeCalledWith('First Device');
  })


  it('The fist time a device is registered the device should be added with "pendingVote" defaulting to true', async () => {

    deviceController.registerDevice('First Device');

    expect(spyGetDevice).toBeCalledWith('First Device');
    expect(spyAddDevice).toBeCalledWith('First Device', expect.objectContaining({ pendingVote: true }))
  })
  afterEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
  });
})

describe('After first registration', () => {

  let spyCreateRefresherTimeOut;
  let spyGetDevice;

  beforeEach(() => {
    spyCreateRefresherTimeOut = jest.spyOn(deviceController, 'createRefresherTimeOut');
    spyGetDevice = jest.spyOn(deviceService, 'getDevice').mockImplementation((deviceId) => deviceMock());
  });

  it('should not create any new timer after the first device registration ', async (done) => {

    const result = deviceController.registerDevice('Second device');

    expect(spyCreateRefresherTimeOut).toHaveBeenCalledTimes(0);
    expect(result).toBe(true);
    done();
  })
})
