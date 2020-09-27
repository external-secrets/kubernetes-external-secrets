/* eslint-env mocha */

const WebhookServer = require('./webhook-server')
const { expect } = require('chai')
const sinon = require('sinon')

describe('Webhook Server', () => {
  let poller1PollSpy
  let poller2PollSpy
  let webhookServer

  beforeEach(async () => {
    poller1PollSpy = sinon.spy()
    poller2PollSpy = sinon.spy()
    webhookServer = new WebhookServer({
      port: 3000,
      logger: {
        info: () => {}
      },
      daemon: {
        getPollers: () => ({
          someId1: {
            poll: poller1PollSpy,
            getIdentifiers: () => ({
              name: 'name1',
              namespace: 'namespace1'
            })
          },
          someId2: {
            poll: poller2PollSpy,
            getIdentifiers: () => ({
              name: 'name2',
              namespace: 'namespace2'
            })
          }
        })
      },
      metrics: {
        observeWebhookSyncRequest: () => {}
      }
    })
  })

  it('should start and stop without errors', async () => {
    await webhookServer.start()
    await webhookServer.stop()
  })

  it('handles non existing routes (POST method)', async () => {
    const response = await webhookServer._app.inject({
      method: 'POST',
      url: '/non-existing'
    })

    expect(response.statusCode).equals(404)
    expect(JSON.parse(response.payload).message).equals('No such route')
  })

  it('handles non existing routes (GET method)', async () => {
    const response = await webhookServer._app.inject({
      method: 'GET',
      url: '/non-existing'
    })

    expect(response.statusCode).equals(404)
    expect(JSON.parse(response.payload).message).equals('No such route')
  })

  describe('/sync', () => {
    it('should not allow requests without any payload', async () => {
      const response = await webhookServer._app.inject({
        method: 'POST',
        url: '/sync'
      })

      expect(response.statusCode).equals(400)
      expect(JSON.parse(response.payload).message).equals('No payload found')
    })

    it('should not allow request without a name in the payload', async () => {
      const response = await webhookServer._app.inject({
        method: 'POST',
        url: '/sync',
        payload: {
          namespace: 'test-namespace'
        }
      })

      expect(response.statusCode).equals(400)
      expect(JSON.parse(response.payload).message).equals('"name" is required')
    })

    it('should not allow request without a namespace in the payload', async () => {
      const response = await webhookServer._app.inject({
        method: 'POST',
        url: '/sync',
        payload: {
          name: 'test-name'
        }
      })

      expect(response.statusCode).equals(400)
      expect(JSON.parse(response.payload).message).equals('"namespace" is required')
    })

    it('should respond with 404 if no poller is found for the given payload (wrong namespace)', async () => {
      const response = await webhookServer._app.inject({
        method: 'POST',
        url: '/sync',
        payload: {
          namespace: 'non-existing-namespace',
          name: 'name2'
        }
      })

      expect(response.statusCode).equals(404)
      expect(JSON.parse(response.payload).message).equals('Secret non-existing-namespace/name2 was not found')
    })

    it('should respond with 404 if no poller is found for the given payload (wrong name)', async () => {
      const response = await webhookServer._app.inject({
        method: 'POST',
        url: '/sync',
        payload: {
          namespace: 'namespace2',
          name: 'non-existing-name'
        }
      })

      expect(response.statusCode).equals(404)
      expect(JSON.parse(response.payload).message).equals('Secret namespace2/non-existing-name was not found')
    })

    it('should trigger the poll method if a matching poller is found', async () => {
      const response = await webhookServer._app.inject({
        method: 'POST',
        url: '/sync',
        payload: {
          namespace: 'namespace2',
          name: 'name2'
        }
      })

      expect(response.statusCode).equals(200)
      expect(JSON.parse(response.payload).message).equals('Triggered sync for secret namespace2/name2')
      expect(poller2PollSpy.called).equals(true)
      expect(poller2PollSpy.calledWith(undefined)).equals(true)
    })

    it('should pass the version parameter to the poll method if one is given', async () => {
      const response = await webhookServer._app.inject({
        method: 'POST',
        url: '/sync',
        payload: {
          namespace: 'namespace2',
          name: 'name2',
          versionSuffix: 'v23'
        }
      })

      expect(response.statusCode).equals(200)
      expect(JSON.parse(response.payload).message).equals('Triggered sync for secret namespace2/name2')
      expect(poller2PollSpy.called).equals(true)
      expect(poller2PollSpy.calledWith('v23')).equals(true)
    })
  })
})
