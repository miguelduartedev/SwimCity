import { render } from '@testing-library/react-native';
import { StatusBadge } from '../components/StatusBadge';
import { getTheme } from '../theme';

describe('StatusBadge', () => {
  it('communicates status in accessible text instead of color alone', () => {
    const screen = render(<StatusBadge status="good" theme={getTheme('light')} />);
    expect(screen.getByLabelText('Swimming status: Good for swimming')).toBeTruthy();
    expect(screen.getByText('Good for swimming')).toBeTruthy();
  });
});
