import React from 'react';
import { render } from '@testing-library/react-native';
import { BrutalistText } from '../../src/components/BrutalistText';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#FAFAFA',
      text: '#0A0A0A',
      primary: '#0A0A0A',
      muted: '#757575',
    },
  }),
}));

describe('BrutalistText', () => {
  it('renders children text', () => {
    const { getByText } = render(<BrutalistText>Hello</BrutalistText>);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('uppercases text when uppercase prop is true', () => {
    const { getByText } = render(<BrutalistText uppercase>hello</BrutalistText>);
    expect(getByText('HELLO')).toBeTruthy();
  });

  it('uses muted color when muted prop is true', () => {
    const { getByText } = render(<BrutalistText muted>Muted</BrutalistText>);
    const text = getByText('Muted');
    const flatStyle = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style)
      : text.props.style;
    expect(flatStyle.color).toBe('#757575');
  });

  it('uses custom color when color prop is set', () => {
    const { getByText } = render(<BrutalistText color="#FF0000">Red</BrutalistText>);
    const text = getByText('Red');
    const flatStyle = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style)
      : text.props.style;
    expect(flatStyle.color).toBe('#FF0000');
  });

  it('applies bold fontWeight when bold is true', () => {
    const { getByText } = render(<BrutalistText bold>Bold</BrutalistText>);
    const text = getByText('Bold');
    const flatStyle = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style)
      : text.props.style;
    expect(flatStyle.fontWeight).toBe('900');
  });

  it('applies custom font size', () => {
    const { getByText } = render(<BrutalistText size={24}>Big</BrutalistText>);
    const text = getByText('Big');
    const flatStyle = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style)
      : text.props.style;
    expect(flatStyle.fontSize).toBe(24);
  });

  it('centers text when center prop is true', () => {
    const { getByText } = render(<BrutalistText center>Center</BrutalistText>);
    const text = getByText('Center');
    const flatStyle = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style)
      : text.props.style;
    expect(flatStyle.textAlign).toBe('center');
  });
});
