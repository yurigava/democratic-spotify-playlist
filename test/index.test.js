const request = require('supertest')
const app = require('../src/index')
const deviceController = require('../src/controllers/device')
const voteController = require('../src/controllers/vote')

describe('Device registration', () => {

  it('Should return error code 400 when no device is sent', async () => {
    const res = await request(app)
      .post('/device/register')
      .send()

    expect(res.statusCode).toBe(400)
  })

  it('The fist time a device is registered should return 201', async () => {
    deviceController.registerDevice = jest.fn(() => false);

    const res = await request(app)
      .post('/device/register')
      .set("deviceId", "XXXX")
      .send()

    expect(res.statusCode).toBe(201)
  })

  it('After the fist registration, a device register return 200', async () => {
    deviceController.registerDevice = jest.fn(() => true);

    const res = await request(app)
      .post('/device/register')
      .set("deviceId", "YYYY")
      .send()

    expect(res.statusCode).toBe(200)
  })
})

describe('Vote registration', () => {
  it('A registered device should get 200 when voteskipping', async () => {
    voteController.registerVote = jest.fn(() => true)

    const res = await request(app)
      .post('/vote/register')
      .set("deviceId", "YYYY1")
      .send()

    expect(res.statusCode).toBe(200)
  })

  it('An uregistered device should get 401 when voteskipping', async () => {
    voteController.registerVote = jest.fn(() => false)

    const res = await request(app)
      .post('/vote/register')
      .set("deviceId", "YYYY2")
      .send()

    expect(res.statusCode).toBe(401)
  })

})


describe('Vote status', () => {
  it('Should return the number of votes for and the total number of possible votes', async () => {
    voteController.votesInFavour = jest.fn(() => 5)
    voteController.totalVotes = jest.fn(() => 15)

    const res = await request(app)
      .get('/vote/status')
      .send();

    expect(res.statusCode).toBe(200);
    expect(res.body.votesInFavour).toBe(5);
    expect(res.body.totalVotes).toBe(15)
  })
})
