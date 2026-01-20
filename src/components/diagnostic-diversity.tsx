'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DiagnosticDiversity() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const testComponents = [
    {
      name: "Basic Card",
      component: () => (
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>Basic card test</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is a basic card component test.</p>
          </CardContent>
        </Card>
      )
    },
    {
      name: "Button Test",
      component: () => (
        <Card>
          <CardContent className="p-4">
            <Button onClick={() => alert('Button works!')}>
              Test Button
            </Button>
          </CardContent>
        </Card>
      )
    },
    {
      name: "Select Test (Problematic Component)",
      component: () => {
        const [value, setValue] = useState('test');
        return (
          <Card>
            <CardContent className="p-4">
              <p>Select component disabled for now due to infinite loop</p>
              <p>Current value: {value}</p>
              <Button onClick={() => setValue('changed')}>Change Value</Button>
            </CardContent>
          </Card>
        );
      }
    }
  ];

  const handleNext = () => {
    try {
      if (step < testComponents.length - 1) {
        setStep(step + 1);
        setError(null);
      }
    } catch (err) {
      setError(`Error in step ${step}: ${err}`);
    }
  };

  const handlePrevious = () => {
    try {
      if (step > 0) {
        setStep(step - 1);
        setError(null);
      }
    } catch (err) {
      setError(`Error in step ${step}: ${err}`);
    }
  };

  const CurrentComponent = testComponents[step]?.component;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Component Diagnostics</CardTitle>
          <CardDescription>
            Testing components step by step to isolate the infinite loop issue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={handlePrevious} 
              disabled={step === 0}
              variant="outline"
            >
              Previous
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={step === testComponents.length - 1}
              variant="outline"
            >
              Next
            </Button>
          </div>
          
          <p className="mb-4">
            Step {step + 1} of {testComponents.length}: {testComponents[step]?.name}
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {CurrentComponent && (
        <div>
          <CurrentComponent />
        </div>
      )}
    </div>
  );
}