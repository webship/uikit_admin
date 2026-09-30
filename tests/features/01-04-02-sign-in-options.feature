@sign-in @a11y
Feature: The options of the sign-in screens
  As a site builder
  I want to show the header and the footer of the site, a logo, an image and a help line on the
  sign-in screens
  So that they carry the brand of the site and still read well on any screen

  Scenario Outline: The <layout> layout with <parts>
    Given UIkit Admin shows the sign-in screens with the "<layout>" layout
      And the sign-in screens show <parts>
     When I go to "/user/login"
     Then the element ".uikit-admin-sign-in--<layout>.uikit-admin-sign-in--login" should exist
      And the element ".uikit-admin-sign-in__header" should <header>
      And the element ".uikit-admin-sign-in__footer" should <footer>
      And the page should have exactly one h1
      And the page should have a main landmark
      And the page should not scroll sideways
      And the element ".uikit-admin-rail" should not exist
      And the page should pass an accessibility audit at level "AAA"

    Examples:
      | layout    | parts                     | header    | footer    |
      | center    | no header and no footer   | not exist | not exist |
      | center    | the header and the footer | exist     | exist     |
      | start     | the header                | exist     | not exist |
      | end       | the footer                | not exist | exist     |
      | top       | the header and the footer | exist     | exist     |
      | bottom    | the header and the footer | exist     | exist     |
      | spotlight | the header and the footer | exist     | exist     |

  Scenario Outline: The <layout> layout reads well in the dark on a phone of <width> pixels
    Given UIkit Admin shows the sign-in screens with the "<layout>" layout
      And the color scheme is "dark"
      And I set the viewport to <width> by 800
     When I go to "/user/login"
     Then the page should not scroll sideways
      And the element ".uikit-admin-sign-in__card" should sit inside the viewport
      And the style "font-size" of the element "#edit-name" should be "16px"
      And the page should pass an accessibility audit at level "AAA"

    Examples:
      | layout    | width |
      | center    | 320   |
      | start     | 390   |
      | end       | 320   |
      | top       | 390   |
      | bottom    | 320   |
      | spotlight | 390   |

  Scenario: A logo that carries the name stands alone
    Given UIkit Admin shows the sign-in screens with the "center" layout
      And the sign-in setting "sign_in_logo" is "theme"
      And the sign-in setting "sign_in_brand" is "logo"
      And I am an anonymous user
     When I go to "/user/login"
     Then ".uikit-admin-sign-in__logo-tile--alone" should be visible
      And the element ".uikit-admin-sign-in__name" should not exist

  Scenario: The logo, the image, its credit and the help line
    Given UIkit Admin shows the sign-in screens with the "end" layout
      And the sign-in setting "sign_in_logo" is "none"
      And the sign-in setting "sign_in_image" is "/core/misc/druplicon.png"
      And the sign-in setting "sign_in_image_credit" is "qa image credit"
      And the sign-in setting "sign_in_help" is "qa help line"
     When I go to "/user/login"
     Then the element ".uikit-admin-sign-in__mark" should not exist
      And the element ".uikit-admin-sign-in__logo" should not exist
      And the element "img.uikit-admin-sign-in__image[alt='']" should exist
      And I should see "qa image credit"
      And I should see "qa help line"
      And the page should pass an accessibility audit at level "AAA"

  Scenario: A long site name stays in the brand panel
    Given UIkit Admin shows the sign-in screens with the "start" layout
      And the configuration "system.site" is put back after the scenario
      And I set the viewport to 390 by 800
      And the configuration "system.site" has "name" set to "The administration of a site with a very long name that goes on and on"
     When I go to "/user/login"
     Then the page should not scroll sideways
      And the element ".uikit-admin-sign-in__card" should sit inside the viewport

  Scenario: Right to left, the card stays on the screen
    Given UIkit Admin shows the sign-in screens with the "start" layout
     When I go to "/user/login"
      And the page is shown right to left
     Then the page should not scroll sideways
      And the element ".uikit-admin-sign-in__card" should sit inside the viewport
