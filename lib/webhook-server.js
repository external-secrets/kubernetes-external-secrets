'use strict'

const fastify = require('fastify')
const Joi = require('joi')
const createError = require('http-errors')

class WebhookServer {
  constructor ({ port, logger, metrics, daemon }) {
    this._port = port
    this._logger = logger
    this._metrics = metrics
    this._daemon = daemon

    this._app = fastify()

    this._app.post('/sync', async (request, reply) => {
      try {
        this._logger.info('Received sync webhook call')

        const payloadSchema = Joi.object({
          name: Joi.string().required(),
          namespace: Joi.string().required(),
          versionSuffix: Joi.string().optional()
        })

        if (!request.body) {
          this._metrics.observeWebhookSyncRequest({ status: 400 })
          throw createError(400, 'No payload found')
        }

        const { error, value } = await payloadSchema.validate(request.body)

        if (error) {
          this._metrics.observeWebhookSyncRequest({ status: 400 })
          throw createError(400, error.message)
        }

        const poller = Object.values(this._daemon.getPollers()).find(
          p => value.name === p.getIdentifiers().name && value.namespace === p.getIdentifiers().namespace
        )

        if (!poller) {
          this._metrics.observeWebhookSyncRequest({ status: 404 })
          throw createError(404, `Secret ${value.namespace}/${value.name} was not found`)
        }

        await poller.poll(value.versionSuffix)

        this._metrics.observeWebhookSyncRequest({ status: 200, name: value.name, namespace: value.namespace })
        return {
          statusCode: 200,
          message: `Triggered sync for secret ${value.namespace}/${value.name}`
        }
      } catch (err) {
        this._metrics.observeWebhookSyncRequest({ status: 500 })
        throw err
      }
    })

    this._app.all('*', async (req, res) => {
      throw createError(404, 'No such route')
    })
  }

  async start () {
    await this._app.listen(this._port, '0.0.0.0')
    this._logger.info(`WebhookServer listening on port ${this._port}`)
  }

  async stop () {
    await this._app.close()
  }
}

module.exports = WebhookServer
