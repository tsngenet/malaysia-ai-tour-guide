export function distanceMetres(a,b,c,d){const R=6371000,r=x=>x*Math.PI/180,x=r(c-a),y=r(d-b),q=Math.sin(x/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
