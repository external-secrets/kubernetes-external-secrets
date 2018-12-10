'use strict';

const { expect } = require('chai');
const sinon = require('sinon');

const { getExternalSecretEvents } = require('./external-secret');

describe('getExternalSecretEvents', () => {
  let kubeClientMock;
  let externalSecretsApiMock;
  let fakeCustomResourceManifest;
  let loggerMock;

  beforeEach(() => {
    fakeCustomResourceManifest = {
      spec: {
        group: 'kubernetes-client.io',
        names: {
          plural: 'externalsecrets'
        }
      }
    };
    externalSecretsApiMock = sinon.mock();
    externalSecretsApiMock.get = sinon.stub();
    kubeClientMock = sinon.mock();
    kubeClientMock.apis = sinon.mock();
    kubeClientMock.apis['kubernetes-client.io'] = sinon.mock();
    kubeClientMock.apis['kubernetes-client.io'].v1 = sinon.mock();
    kubeClientMock.apis['kubernetes-client.io']
      .v1.externalsecrets = externalSecretsApiMock;
    loggerMock = sinon.mock();
  });

  it('gets a stream of external secret events', async () => {
    const fakeExternalSecretObject = { type: 'ExtrenalSecret' };
    externalSecretsApiMock.get.resolves({
      body: {
        items: [fakeExternalSecretObject]
      }
    });

    const events = getExternalSecretEvents({
      kubeClient: kubeClientMock,
      customResourceManifest: fakeCustomResourceManifest,
      intervalMilliseconds: 0,
      logger: loggerMock
    });

    const deletedAllEvent = await events.next();
    expect(deletedAllEvent.value.type).is.equal('DELETED_ALL');
    const addedEvent = await events.next();
    expect(addedEvent.value.type).is.equal('ADDED');
    expect(addedEvent.value.object).is.deep.equal(fakeExternalSecretObject);
    events.return(null);
  });
});
