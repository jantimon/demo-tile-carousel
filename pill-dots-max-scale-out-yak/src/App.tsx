import { Carousel, CarouselSlide } from "./Carousel";

export const App = () => (
  <Carousel slideCount={10}>
    {Array.from({ length: 10 }, (_, i) => (
      <CarouselSlide key={i}>Item {i + 1}</CarouselSlide>
    ))}
  </Carousel>
);
