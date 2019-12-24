const request = require('supertest')
const app = require('../src/index')
const voteSkip = require('../src/voteSkip')

describe('Device registration', () => {
  it('The fist time a device is registred should return 201', async () => {
    voteSkip.registerDevice = jest.fn(() => false);

    const res = await request(app)
      .get('/register')
      .set("deviceId", "XXXX")
      .send()
    expect(res.statusCode).toBe(201)
  })

  it('After the fist registration, a device register return 200', async () => {
    voteSkip.registerDevice = jest.fn(() => true);

    const res = await request(app)
      .get('/register')
      .set("deviceId", "YYYY")
      .send()

    expect(res.statusCode).toBe(200)
  })
})

describe('Voteskip', () => {
  it('A registred device should get 200 when voteskiping', async () => {
    voteSkip.registerVote = jest.fn(() => true)

    const res = await request(app)
      .get('/voteskip')
      .set("deviceId", "YYYY1")
      .send()
    expect(res.statusCode).toBe(200)
  })

  it('An uregistred device should get 401 when voteskiping', async () => {
    voteSkip.registerVote = jest.fn(() => false)

    const res = await request(app)
      .get('/voteskip')
      .set("deviceId", "YYYY2")
      .send()

    expect(res.statusCode).toBe(401)
  })

})