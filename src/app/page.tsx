
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect the user from the root path ("/") to the "/cell-locator" page.
  redirect('/cell-locator');
}
