Feature: A demonstration
As a human
I want to do x
So that I can achieve y

  Scenario: Eat 5 out of 12
  
    Given there are 12 cucumbers
     When I eat 5 cucumbers
     Then I should have 7 cucumbers
  
  Scenario Outline: Eating
  
    Given that there are <start> cucumbers
     When I eat <eat> cucumbers
     Then I should have <left> cucumbers
  
      | start | eat | left | 
      | 20    | 10  | 10   | 
      | 15    | 3   | 12   | 
  
  
