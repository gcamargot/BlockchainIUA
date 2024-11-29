import Alert from 'react-bootstrap/Alert';

interface AlertProps {
    variant: string;
    heading: string;
    text: string;
    }


function AlertCFP({variant, heading, text} : AlertProps)  {
  return (
    <Alert variant={variant}>
      <Alert.Heading>{heading}</Alert.Heading>
      <p>
        {text}
      </p>
      <hr />
    </Alert>
  );
}

export default AlertCFP;