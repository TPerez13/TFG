import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import ForgotPasswordScreen from '../../src/screens/ForgotPasswordScreen';
import * as apiModule from '../../src/services/api';
import { jsonResponse } from '../helpers/http';

const flushAsyncWork = async (cycles = 3): Promise<void> => {
  for (let index = 0; index < cycles; index += 1) {
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
  }
};

afterEach(() => {
  mock.restoreAll();
});

describe('ForgotPasswordScreen', () => {
  it('keeps the recovery flow in two steps and only shows reset fields after requesting the code', async () => {
    mock.method(apiModule, 'apiFetch', async () =>
      jsonResponse({
        message:
          'Si el correo existe, enviamos instrucciones para restablecer la contraseña.',
      })
    );

    const navigation = {
      navigate: () => undefined,
    } as any;
    const route = {
      key: 'ForgotPassword-test',
      name: 'ForgotPassword',
    } as any;

    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<ForgotPasswordScreen navigation={navigation} route={route} />);
      await flushAsyncWork();
    });

    const requestButton = () =>
      renderer!.root.findAllByType(Button).find((node) => node.props.title === 'Solicitar código');

    assert.ok(requestButton());
    assert.equal(renderer!.root.findAllByType(Input).length, 1);

    await act(async () => {
      renderer!.root.findAllByType(Input)[0]?.props.onChangeText('ana@example.com');
      await flushAsyncWork();
    });

    await act(async () => {
      requestButton()?.props.onPress();
      await flushAsyncWork();
    });

    const buttonTitles = renderer!.root.findAllByType(Button).map((node) => node.props.title);
    const infoMessages = renderer!.root
      .findAll((node) => typeof node.props.children === 'string')
      .map((node) => String(node.props.children));

    assert.equal(renderer!.root.findAllByType(Input).length, 4);
    assert.ok(buttonTitles.includes('Restablecer contraseña'));
    assert.ok(
      infoMessages.includes(
        'Si el correo existe, enviamos instrucciones para restablecer la contraseña.'
      )
    );
  });
});
